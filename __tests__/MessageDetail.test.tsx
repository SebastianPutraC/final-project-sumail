import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MessageDetail from "../components/MessageDetail";
import { getDoc, getDocs } from "firebase/firestore";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("../firebase/firebaseConfig", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

// Mock the ComposeForm child component
jest.mock("../components/ComposeForm", () => {
  return function MockComposeForm({ type }: { type: string }) {
    return <div data-testid="compose-form">Form Type: {type}</div>;
  };
});

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
  replyFromMessageId: ["main-slug"],
  sentDate: mockTimestamp,
};

const userData = {
  email: "sender@test.com",
};

describe("MessageDetail Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the message thread, fetches user emails, and displays content", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      id: "main-slug",
      data: () => mainMessageData,
    });

    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => userData,
    });

    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [],
    });

    render(<MessageDetail slug="main-slug" />);

    await waitFor(() => {
      expect(screen.getByText("Main Subject")).toBeInTheDocument();
    });

    expect(screen.getByText("This is the main content.")).toBeInTheDocument();
    expect(screen.getByText(/from: sender@test.com/i)).toBeInTheDocument();
  });

  it("renders replies correctly", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      id: "main-slug",
      data: () => mainMessageData,
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => userData,
    });
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [
        {
          id: "reply-1",
          data: () => replyMessageData,
        },
      ],
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ email: "replier@test.com" }),
    });

    render(<MessageDetail slug="main-slug"/>);

    await waitFor(() => {
      expect(screen.getByText("Main Subject")).toBeInTheDocument();
      expect(screen.getByText("(replied)")).toBeInTheDocument();
    });

    expect(screen.getByText("This is a reply.")).toBeInTheDocument();
    expect(screen.getByText(/from: replier@test.com/i)).toBeInTheDocument();
  });

  it("toggles the Reply form", async () => {
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

    fireEvent.click(replyBtn);
    expect(screen.getByTestId("compose-form")).toHaveTextContent("Form Type: reply");

    fireEvent.click(replyBtn);
    expect(screen.queryByTestId("compose-form")).not.toBeInTheDocument();
  });

  it("toggles the Forward form", async () => {
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

    fireEvent.click(forwardBtn);
    expect(screen.getByTestId("compose-form")).toHaveTextContent("Form Type: forward");
  });
});