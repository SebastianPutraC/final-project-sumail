import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MessageDetail from "../components/MessageDetail"; // Adjust path if needed
import { getDoc, getDocs } from "firebase/firestore";

// --- MOCKS ---

// 1. Mock Next.js Router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// 2. Mock Firebase Config
jest.mock("../firebase/firebaseConfig", () => ({
  db: {}, // Empty object acts as the db instance
}));

// 3. Mock Firebase Firestore functions
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

// 4. Mock the ComposeForm child component
// We mock this to avoid testing the form's logic, just its presence
jest.mock("../components/ComposeForm", () => {
  return function MockComposeForm({ type }: { type: string }) {
    return <div data-testid="compose-form">Form Type: {type}</div>;
  };
});

// --- HELPER DATA ---

const mockDate = new Date("2023-01-01T12:00:00");
const mockTimestamp = {
  toDate: () => mockDate,
};

const mainMessageData = {
  title: "Main Subject",
  content: "This is the main content.",
  senderId: "user1",
  receiverId: "user2",
  receiverEmail: "receiver@test.com",
  replyFromMessageId: [],
  sentDate: mockTimestamp,
};

const replyMessageData = {
  title: "Re: Main Subject",
  content: "This is a reply.",
  senderId: "user2",
  receiverId: "user1",
  receiverEmail: "sender@test.com",
  replyFromMessageId: ["main-slug"], // Links back to main message
  sentDate: mockTimestamp,
};

const userData = {
  email: "sender@test.com",
};

describe("MessageDetail Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 'Message not found' when the main document does not exist", async () => {
    // Mock getDoc to return exists: false
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    render(<MessageDetail slug="invalid-slug" />);

    await waitFor(() => {
      expect(screen.getByText("Message not found")).toBeInTheDocument();
    });
  });

  it("renders the message thread, fetches user emails, and displays content", async () => {
    // 1. Mock Main Message Fetch
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      id: "main-slug",
      data: () => mainMessageData,
    });

    // 2. Mock Sender User Fetch (for the main message)
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => userData,
    });

    // 3. Mock Replies Query (return empty array for simplicity first)
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [],
    });

    render(<MessageDetail slug="main-slug" />);

    // Wait for async effects
    await waitFor(() => {
      expect(screen.getByText("Main Subject")).toBeInTheDocument();
    });

    expect(screen.getByText("This is the main content.")).toBeInTheDocument();
    // Check if email was resolved from the user ID
    expect(screen.getByText(/from: sender@test.com/i)).toBeInTheDocument();
  });

  it("renders replies correctly", async () => {
    // 1. Main Msg
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      id: "main-slug",
      data: () => mainMessageData,
    });
    // 2. Main Msg Sender
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => userData,
    });
    // 3. Replies List
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [
        {
          id: "reply-1",
          data: () => replyMessageData,
        },
      ],
    });
    // 4. Reply Sender
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ email: "replier@test.com" }),
    });

    render(<MessageDetail slug="main-slug"/>);

    await waitFor(() => {
      // Check main message
      expect(screen.getByText("Main Subject")).toBeInTheDocument();
      // Check reply title (your code adds logic: if replyFromMessageId exists, title might display differently)
      // Based on your code: {m.replyFromMessageId... > 0 ? "(replied)" : m.title}
      expect(screen.getByText("(replied)")).toBeInTheDocument();
    });

    expect(screen.getByText("This is a reply.")).toBeInTheDocument();
    expect(screen.getByText(/from: replier@test.com/i)).toBeInTheDocument();
  });

  it("toggles the Reply form", async () => {
    // Setup minimal successful load
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      id: "main-slug",
      data: () => mainMessageData,
    });
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    render(<MessageDetail slug="main-slug"/>);

    await waitFor(() => {
      expect(screen.getByText("Main Subject")).toBeInTheDocument();
    });

    const replyBtn = screen.getByRole("button", { name: /reply/i });

    // Click Reply
    fireEvent.click(replyBtn);
    expect(screen.getByTestId("compose-form")).toHaveTextContent("Form Type: reply");

    // Toggle off
    fireEvent.click(replyBtn);
    expect(screen.queryByTestId("compose-form")).not.toBeInTheDocument();
  });

  it("toggles the Forward form", async () => {
    // Setup minimal successful load
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      id: "main-slug",
      data: () => mainMessageData,
    });
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    render(<MessageDetail slug="main-slug"/>);

    await waitFor(() => {
      expect(screen.getByText("Main Subject")).toBeInTheDocument();
    });

    const forwardBtn = screen.getByRole("button", { name: /forward/i });

    // Click Forward
    fireEvent.click(forwardBtn);
    expect(screen.getByTestId("compose-form")).toHaveTextContent("Form Type: forward");
  });

  it("handles history toggling", async () => {
    // To test history, we need a Reply that links to the Main message.
    // 1. Main Msg
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      id: "main-slug",
      data: () => mainMessageData, // This has no history
    });
    // 2. Sender
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: true, data: () => userData });
    
    // 3. Replies
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [
        {
          id: "reply-1",
          data: () => replyMessageData, // This has replyFromMessageId: ['main-slug']
        },
      ],
    });
    // 4. Reply Sender
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: true, data: () => userData });

    render(<MessageDetail slug="main-slug"/>);

    await waitFor(() => {
      expect(screen.getByText("(replied)")).toBeInTheDocument();
    });

    // The Main Message won't have a "Show History" button because `replyFromMessageId` is empty.
    // The Reply Message SHOULD have a "Show History" button because `replyFromMessageId` points to "main-slug".
    
    const showHistoryBtn = screen.getByText("Show History");
    expect(showHistoryBtn).toBeInTheDocument();

    // Click it
    fireEvent.click(showHistoryBtn);

    // Now we should see the "History:" section and the content of the history message
    expect(screen.getByText("Hide History")).toBeInTheDocument();
    expect(screen.getByText("History:")).toBeInTheDocument();
    
    // The history content is "This is the main content." (from mainMessageData)
    // It appears twice now: once as the main message at the top, and once inside the history block of the reply.
    const contentElements = screen.getAllByText("This is the main content.");
    expect(contentElements.length).toBeGreaterThan(1);
  });
});