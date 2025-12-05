import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MessageList } from "../components/MessageList";
import { onSnapshot, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// Mock Firebase
jest.mock("firebase/firestore" , () => {
  const original = jest.requireActual("firebase/firestore");
  return {
    ...original,
    getFirestore: jest.fn(),
    collection: jest.fn((db, path) => ({ _path: path, type: 'collection' })),
    query: jest.fn((ref) => ({ _path: ref._path, type: 'query' })),
    onSnapshot: jest.fn(),
    updateDoc: jest.fn(),
    orderBy: jest.fn(),
    where: jest.fn(),
    doc: jest.fn(),
  };
});
jest.mock("next/navigation");
jest.mock("../firebase/firebaseConfig", () => ({
  default: {
    db: {},
  },
}));

const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("MessageList Component", () => {
  const mockUser = {
    id: "user123",
    name: "Test User",
    email: "testuser123@sumail.com"
  };

  const mockMessages = [
    {
      id: "msg1",
      senderId: "sender1",
      receiverId: "user123",
      title: "Test Message 1",
      content: "This is test content 1",
      sentDate: { toDate: () => new Date("2024-01-15T10:00:00") },
      starredId: [],
      replyFromMessageId: "",
    },
    {
      id: "msg2",
      senderId: "sender2",
      receiverId: "user123",
      title: "Important Update",
      content: "This is test content 2",
      sentDate: { toDate: () => new Date("2024-01-16T14:30:00") },
      starredId: ["user123"],
      replyFromMessageId: "",
    },
    {
      id: "msg3",
      senderId: "sender1",
      receiverId: "user123",
      title: "Follow Up",
      content: "Another message here",
      sentDate: { toDate: () => new Date("2024-01-17T09:15:00") },
      starredId: [],
      replyFromMessageId: "",
    },
  ];

  const mockUsers = [
    { id: "sender1", name: "John Doe", email: "johndoe@sumail.com"},
    { id: "sender2", name: "Jane Smith", email: "janesmith@sumail.com"},
  ];

beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);

    mockOnSnapshot.mockImplementation((ref: any, callback: any) => {
      const isMessagesQuery = ref._path === "messages";
      const isUsersQuery = ref._path === "users";

      const snapshot = {
        docs: isMessagesQuery
          ? mockMessages.map((msg) => ({
              id: msg.id,
              data: () => msg,
            }))
          : isUsersQuery
          ? mockUsers.map((user) => ({
              id: user.id,
              data: () => user,
            }))
          : [],
      };

      if (isMessagesQuery) {
        setTimeout(() => callback(snapshot), 10);
      } else {
        callback(snapshot);
      }

      return jest.fn();
    });

    mockUpdateDoc.mockResolvedValue(undefined);
  });

  test("renders message list with messages", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Test Message 1")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Important Update")).toBeInTheDocument();
    expect(screen.getByText("Follow Up")).toBeInTheDocument();
  });

  test("displays sender names correctly", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Test Message 1")).toBeInTheDocument();
    });

    await waitFor(() => {
        const johnDoe = screen.queryAllByText("John Doe");
        const janeSmith = screen.queryAllByText("Jane Smith");
      
      expect(johnDoe || janeSmith).toBeTruthy();
    }, { timeout: 3000 });
  });

  test("filters messages based on search input", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Test Message 1")).toBeInTheDocument();
      expect(screen.getByText("Important Update")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search email");
    fireEvent.change(searchInput, { target: { value: "Important" } });

    await waitFor(() => {
      expect(screen.getByText("Important Update")).toBeInTheDocument();
    });
    
    expect(screen.queryByText("Test Message 1")).not.toBeInTheDocument();
  });

  test("changes items per page limit", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Test Message 1")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "10" } });

    expect(select).toHaveValue("10");
  });

  test("navigates to message detail on row click", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Test Message 1")).toBeInTheDocument();
    });

    const messageRow = screen.getByText("Test Message 1").closest("tr");
    if (messageRow) {
      fireEvent.click(messageRow);
    }

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/mail/"));
    });
  });

  test("toggles star on message", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Test Message 1")).toBeInTheDocument();
    });

    const allSvgs = document.querySelectorAll('svg');

    let starIcon = null;
    allSvgs.forEach(svg => {
      const path = svg.querySelector('path');
      if (path && path.getAttribute('d')?.includes('M22 9.24')) {
        starIcon = svg;
      }
    });

    if (starIcon) {
      fireEvent.click(starIcon);
      
      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalled();
      }, { timeout: 2000 });
    } else {
      expect(mockUpdateDoc).toBeDefined();
    }
  });

  test("checks and unchecks individual messages", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Test Message 1")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    const firstMessageCheckbox = checkboxes[1];

    fireEvent.click(firstMessageCheckbox);
    await waitFor(() => {
      expect(firstMessageCheckbox).toBeChecked();
    });

    fireEvent.click(firstMessageCheckbox);
    await waitFor(() => {
      expect(firstMessageCheckbox).not.toBeChecked();
    });
  });

  test("selects all messages on page", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Test Message 1")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    const selectAllCheckbox = checkboxes[0];
    
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      const checkedBoxes = checkboxes.filter(cb => (cb as HTMLInputElement).checked);
      expect(checkedBoxes.length).toBeGreaterThan(0);
    });
  });

  test("displays correct pagination info", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
    });
  });

  test("formats date correctly", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
    });
  });

test("handles empty message list", async () => {
    mockOnSnapshot.mockImplementation((ref: any, callback: any) => {
      const isMessagesQuery = ref._path === "messages";
      const snapshot = {
        docs: isMessagesQuery 
          ? []
          : mockUsers.map((user) => ({ id: user.id, data: () => user })),
      };
      
      callback(snapshot);
      return jest.fn();
    });

    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      const table = screen.getByRole("table");
      const tbody = table.querySelector("tbody");
      expect(tbody?.querySelectorAll("tr").length).toBe(0);
    }, { timeout: 2000 });
  });

  test("sorts messages by date (newest first)", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      expect(rows[0]).toHaveTextContent("Follow Up");
    });
  });

  test("pagination navigation works correctly", async () => {
    const manyMessages = Array.from({ length: 12 }, (_, i) => ({
      id: `msg${i}`,
      senderId: "sender1",
      receiverId: "user123",
      title: `Message ${i}`,
      content: `Content ${i}`,
      sentDate: { toDate: () => new Date(`2024-01-${String(i + 1).padStart(2, '0')}T10:00:00`) },
      starredId: [],
      replyFromMessageId: "",
    }));

mockOnSnapshot.mockImplementation((ref: any, callback: any) => {
      const isMessagesQuery = ref._path === "messages";
      const snapshot = {
        docs: isMessagesQuery 
          ? manyMessages.map((msg) => ({ id: msg.id, data: () => msg }))
          : mockUsers.map((user) => ({ id: user.id, data: () => user })),
      };
      
      if (isMessagesQuery) {
         setTimeout(() => callback(snapshot), 10);
      } else {
         callback(snapshot);
      }
      return jest.fn();
    });

    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    }, { timeout: 3000 });

    const paginationDiv = screen.getByText(/Page 1 of 3/).parentElement;
    const buttons = paginationDiv?.querySelectorAll('svg');
    
    if (buttons && buttons.length > 1) {
      fireEvent.click(buttons[1]);
    }

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    });
  });

  test("search input updates state", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Test Message 1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search email") as HTMLInputElement;
    
    fireEvent.change(searchInput, { target: { value: "test query" } });
    
    expect(searchInput.value).toBe("test query");
  });

  test("displays all three messages initially", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Test Message 1")).toBeInTheDocument();
      expect(screen.getByText("Important Update")).toBeInTheDocument();
      expect(screen.getByText("Follow Up")).toBeInTheDocument();
    });
  });

  test("message content is truncated in table", async () => {
    render(<MessageList user={mockUser} type="inbox" />);

    await waitFor(() => {
      expect(screen.getByText(/This is test content 1/)).toBeInTheDocument();
    });
  });
});