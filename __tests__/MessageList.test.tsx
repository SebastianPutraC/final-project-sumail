import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MessageList } from "../components/MessageList"; // Verify this path matches your file structure
import { useRouter } from "next/navigation";
import * as firestore from "firebase/firestore";

// --- MOCKS ---

// 1. Mock Next.js Router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// 2. Mock Firebase Config
// We define a specific DB object to check equality against
const mockDb = { type: "firestore-db" };
jest.mock("../firebase/firebaseConfig", () => ({
  __esModule: true,
  default: { db: { type: "firestore-db" } },
}));

// 3. Mock MUI Icons (CRITICAL FIX: Pass {...props} to enable onClick)
jest.mock("@mui/icons-material/StarBorderOutlined", () => (props: any) => <div data-testid="StarBorderOutlinedIcon" {...props} />);
jest.mock("@mui/icons-material/Star", () => (props: any) => <div data-testid="StarIcon" {...props} />);
jest.mock("@mui/icons-material/KeyboardArrowLeft", () => (props: any) => <div data-testid="KeyboardArrowLeftIcon" {...props} />);
jest.mock("@mui/icons-material/IndeterminateCheckBox", () => (props: any) => <div data-testid="IndeterminateCheckBoxIcon" {...props} />);
jest.mock("@mui/icons-material/CheckBoxOutlineBlank", () => (props: any) => <div data-testid="CheckBoxOutlineBlankIcon" {...props} />);
jest.mock("@mui/icons-material/DeleteOutline", () => (props: any) => <div data-testid="DeleteOutlineIcon" {...props} />);
jest.mock("@mui/icons-material/Search", () => (props: any) => <div data-testid="SearchIcon" {...props} />);

// 4. Mock Firestore
jest.mock("firebase/firestore", () => {
  return {
    getFirestore: jest.fn(),
    collection: jest.fn((db, path) => ({ type: "collection", path })), 
    query: jest.fn(() => ({ type: "query" })),
    where: jest.fn(),
    // doc returns a reference object we can track
    doc: jest.fn((db, coll, id) => ({ refPath: `${coll}/${id}` })), 
    updateDoc: jest.fn(),
    arrayUnion: jest.fn((id) => ({ type: "union", id })),
    arrayRemove: jest.fn((id) => ({ type: "remove", id })),
    onSnapshot: jest.fn(),
  };
});

describe("MessageList Component", () => {
  const mockPush = jest.fn();
  const mockUser = { id: "user-123", name: "Test User", email: "user123@sumail.com" };

  const mockDate = (dateString: string) => ({
    toDate: () => new Date(dateString),
  });

  const mockUsersData = [
    { id: "sender-1", data: () => ({ name: "Alice" }) },
    { id: "sender-2", data: () => ({ name: "Bob" }) },
  ];

  const msg1 = {
    id: "msg-1",
    data: () => ({
      senderId: "sender-1",
      receiverId: ["user-123"],
      title: "Old Message",
      content: "Meeting yesterday",
      sentDate: mockDate("2023-10-01T10:00:00"),
      starredId: [], // Not starred
      readId: [],
      activeId: ["user-123"],
      replyFromMessageId: "",
    }),
  };

  const msg2 = {
    id: "msg-2",
    data: () => ({
      senderId: "sender-2",
      receiverId: ["user-123"],
      title: "New Message",
      content: "Project deadline",
      sentDate: mockDate("2023-10-02T12:00:00"),
      starredId: ["user-123"],
      readId: ["user-123"],
      activeId: ["user-123"],
      replyFromMessageId: "",
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    // Mock onSnapshot logic
    (firestore.onSnapshot as jest.Mock).mockImplementation((ref, callback) => {
      if (ref.path === "users") {
        callback({ docs: mockUsersData });
      } else {
        callback({ docs: [msg1, msg2] });
      }
      return jest.fn(); 
    });
  });

  it("renders messages correctly sorted by date (newest first)", async () => {
    render(<MessageList user={mockUser} type="received" />);
    await waitFor(() => expect(screen.getByText("New Message")).toBeInTheDocument());
    
    const rows = screen.getAllByRole("row");
    expect(rows[0]).toHaveTextContent("New Message");
    expect(rows[1]).toHaveTextContent("Old Message");
  });

  it("navigates to message detail on row click", async () => {
    render(<MessageList user={mockUser} type="received" />);
    await waitFor(() => screen.getByText("New Message"));

    const row = screen.getByText("New Message").closest("tr");
    fireEvent.click(row!);

    expect(mockPush).toHaveBeenCalledWith("/mail/msg-2");
  });

  it("filters messages based on search input", async () => {
    render(<MessageList user={mockUser} type="received" />);
    await waitFor(() => screen.getByText("New Message"));

    const searchInput = screen.getByPlaceholderText("Search email");
    fireEvent.change(searchInput, { target: { value: "deadline" } }); 

    expect(screen.getByText("New Message")).toBeInTheDocument();
    expect(screen.queryByText("Old Message")).not.toBeInTheDocument();
  });

  it("handles pagination correctly", async () => {
    const manyMessages = Array.from({ length: 7 }, (_, i) => ({
      id: `msg-pag-${i}`,
      data: () => ({
        senderId: "sender-1",
        receiverId: ["user-123"],
        title: `Title ${i}`,
        content: "Content",
        sentDate: mockDate(`2023-10-0${i + 1}T12:00:00`),
        starredId: [],
        readId: [],
        activeId: ["user-123"],
        replyFromMessageId: "",
      }),
    }));

    (firestore.onSnapshot as jest.Mock).mockImplementation((ref, callback) => {
        if (ref.path === "users") callback({ docs: mockUsersData });
        else callback({ docs: manyMessages });
        return jest.fn();
    });

    render(<MessageList user={mockUser} type="received" />);
    await waitFor(() => screen.getByText("Title 6")); 

    expect(screen.getByText("Title 6")).toBeInTheDocument();
    expect(screen.queryByText("Title 1")).not.toBeInTheDocument();

    const nextBtn = screen.getAllByTestId("KeyboardArrowLeftIcon")[1];
    fireEvent.click(nextBtn);

    expect(screen.getByText("Title 1")).toBeInTheDocument();
  });

  it("toggles star status", async () => {
    render(<MessageList user={mockUser} type="received" />);
    await waitFor(() => screen.getByText("Old Message"));

    const row = screen.getByText("Old Message").closest("tr");
    // This finds the mocked div which NOW has the onClick handler because of {...props}
    const starBtn = within(row!).getByTestId("StarBorderOutlinedIcon");
    
    // Stop Propagation is called in component, fireEvent handles this natively mostly,
    // but we need to ensure we are clicking the element that has the handler.
    fireEvent.click(starBtn);

    expect(firestore.doc).toHaveBeenCalledWith(
        expect.objectContaining({ type: "firestore-db" }), 
        "messages", 
        "msg-1"
    );

    expect(firestore.updateDoc).toHaveBeenCalledWith(
        { refPath: "messages/msg-1" }, 
        { starredId: { type: "union", id: "user-123" } }
    );
  });

  it("deletes selected messages", async () => {
    render(<MessageList user={mockUser} type="received" />);
    await waitFor(() => screen.getByText("Old Message"));

    const row = screen.getByText("Old Message").closest("tr");
    const checkbox = within(row!).getByRole("checkbox");
    fireEvent.click(checkbox);

    const deleteBtn = screen.getByTestId("DeleteOutlineIcon");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
        expect(firestore.updateDoc).toHaveBeenCalledWith(
            { refPath: "messages/msg-1" },
            { activeId: { type: "remove", id: "user-123" } }
        );
    });
  });
});