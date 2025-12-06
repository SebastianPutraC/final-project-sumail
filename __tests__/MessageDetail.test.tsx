import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import MessageDetail from "../components/MessageDetail";
import { useRouter } from "next/navigation";
import * as firestore from "firebase/firestore";
import * as CurrentUser from "@/utils/CurrentUser";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../firebase/firebaseConfig", () => ({
  __esModule: true,
  default: { db: { type: "firestore-db" } },
}));

jest.mock("../components/ComposeForm", () => ({
  __esModule: true,
  default: ({ type }: any) => <div data-testid="compose-form">Mock Form: {type}</div>,
}));

jest.mock("@mui/icons-material/Reply", () => (props: any) => <div data-testid="ReplyIcon" {...props} />);
jest.mock("@mui/icons-material/Shortcut", () => (props: any) => <div data-testid="ShortcutIcon" {...props} />);

jest.mock("@/utils/CurrentUser", () => ({
  GetCurrentUser: jest.fn(),
}));

jest.mock("firebase/firestore", () => {
  return {
    collection: jest.fn(),
    doc: jest.fn((db, col, id) => ({ type: "ref", path: `${col}/${id}`, id })),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    arrayUnion: jest.fn((val) => ({ type: "union", val })),
    arrayRemove: jest.fn((val) => ({ type: "remove", val })),
  };
});

describe("MessageDetail Component", () => {
  const mockPush = jest.fn();
  const mockUser = { id: "user-123", email: "me@test.com" };
  const originalLocation = window.location;

  const mockTimestamp = (dateStr: string) => ({
    toDate: () => new Date(dateStr),
  });

  const mainMessageId = "msg-main";
  const mainSenderId = "sender-001";
  const replySenderId = "sender-002";

  const mockMainMessageData = {
    title: "Main Thread Title",
    content: "This is the main content.",
    senderId: mainSenderId,
    receiverId: ["user-123"],
    receiverEmail: "me@test.com",
    sentDate: mockTimestamp("2023-01-01T10:00:00"),
    starredId: [],
    readId: ["user-123"],
    activeId: ["user-123"],
    replyFromMessageId: [],
  };

  const mockReplyData = {
    title: "Re: Main Thread Title",
    content: "This is a reply.",
    senderId: replySenderId,
    receiverId: ["user-123"],
    receiverEmail: "me@test.com",
    sentDate: mockTimestamp("2023-01-01T12:00:00"),
    starredId: [],
    readId: ["user-123"],
    activeId: ["user-123"],
    replyFromMessageId: [mainMessageId],
  };

  const mockMainSender = { email: "main-sender@example.com" };
  const mockReplySender = { email: "replier@example.com" };

  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { reload: jest.fn() };
  });

  afterAll(() => {
    // @ts-ignore
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (CurrentUser.GetCurrentUser as jest.Mock).mockReturnValue({ user: mockUser });

    (firestore.getDoc as jest.Mock).mockImplementation(async (ref) => {
      if (ref.id === mainMessageId) {
        return { exists: () => true, id: mainMessageId, data: () => mockMainMessageData };
      }
      if (ref.id === mainSenderId) {
        return { exists: () => true, id: mainSenderId, data: () => mockMainSender };
      }
      if (ref.id === replySenderId) {
        return { exists: () => true, id: replySenderId, data: () => mockReplySender };
      }
      return { exists: () => false };
    });

    (firestore.getDocs as jest.Mock).mockResolvedValue({
      docs: [{ id: "msg-reply-1", data: () => mockReplyData }],
    });
  });

  it("renders the main message and sender email correctly", async () => {
    render(<MessageDetail slug={mainMessageId} />);

    await waitFor(() => {
      expect(screen.getByText("Main Thread Title")).toBeInTheDocument();
    });

    expect(screen.getByText("from: main-sender@example.com")).toBeInTheDocument();
    
    expect(screen.getByText("This is the main content.")).toBeInTheDocument();
  });

  it("renders replies (threaded view)", async () => {
    render(<MessageDetail slug={mainMessageId} />);

    await waitFor(() => {
      expect(screen.getByText("(replied)")).toBeInTheDocument();
    });

    expect(screen.getByText("This is the main content.")).toBeInTheDocument();
    expect(screen.getByText("This is a reply.")).toBeInTheDocument();
    
    expect(screen.getByText("from: replier@example.com")).toBeInTheDocument();
  });

  it("handles toggling star status (Add Star)", async () => {
    render(<MessageDetail slug={mainMessageId} />);
    await waitFor(() => screen.getByText("Main Thread Title"));

    const starButtons = screen.getAllByText("Star");
    
    fireEvent.click(starButtons[0]);

    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        { type: "ref", path: "messages/msg-main", id: "msg-main" },
        { starredId: { type: "union", val: "user-123" } }
      );
    });
  });

  it("handles deleting a message", async () => {
    render(<MessageDetail slug={mainMessageId} />);
    await waitFor(() => screen.getByText("Main Thread Title"));

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        { type: "ref", path: "messages/msg-main", id: "msg-main" },
        { activeId: { type: "remove", val: "user-123" } }
      );
    });

    expect(mockPush).toHaveBeenCalledWith("/mail/inbox");
  });

  it("opens Reply form when Reply button is clicked", async () => {
    render(<MessageDetail slug={mainMessageId} />);
    await waitFor(() => screen.getByText("Main Thread Title"));

    const replyBtns = screen.getAllByText("Reply");
    fireEvent.click(replyBtns[0]);

    expect(screen.getByTestId("compose-form")).toBeInTheDocument();
    expect(screen.getByText("Mock Form: reply")).toBeInTheDocument();
  });

  it("opens Forward form when Forward button is clicked", async () => {
    render(<MessageDetail slug={mainMessageId} />);
    await waitFor(() => screen.getByText("Main Thread Title"));

    const forwardBtns = screen.getAllByText("Forward");
    fireEvent.click(forwardBtns[0]);

    expect(screen.getByTestId("compose-form")).toBeInTheDocument();
    expect(screen.getByText("Mock Form: forward")).toBeInTheDocument();
  });

  it("shows history when 'Show History' is toggled on a reply", async () => {
    render(<MessageDetail slug={mainMessageId} />);
    await waitFor(() => screen.getByText("(replied)"));

    const showHistoryBtn = screen.getByText("Show History");
    fireEvent.click(showHistoryBtn);

    expect(screen.getByText("Hide History")).toBeInTheDocument();
    expect(screen.getByText("History:")).toBeInTheDocument();
  });

  it("marks the message as read if unread", async () => {
    (firestore.getDoc as jest.Mock).mockImplementationOnce(async (ref) => {
        if (ref.id === mainMessageId) {
            return { 
                exists: () => true, 
                id: mainMessageId, 
                data: () => ({ ...mockMainMessageData, readId: [] }) 
            };
        }
        return { exists: () => false };
    });

    render(<MessageDetail slug={mainMessageId} />);

    await waitFor(() => {
        expect(firestore.updateDoc).toHaveBeenCalledWith(
            { type: "ref", path: "messages/msg-main", id: "msg-main" },
            { readId: { type: "union", val: "user-123" } }
        );
    });
  });

  it("handles non-existent messages gracefully", async () => {
    (firestore.getDoc as jest.Mock).mockImplementation(async () => {
      return { exists: () => false };
    });

    render(<MessageDetail slug="invalid-slug" />);

    await waitFor(() => expect(firestore.getDoc).toHaveBeenCalled());

    expect(screen.queryByText("Main Thread Title")).not.toBeInTheDocument();
  });
});