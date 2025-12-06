import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComposeForm from "../components/ComposeForm";
import { useRouter } from "next/navigation";
import { addDoc, getDocs, collection } from "firebase/firestore"; 
import { toast } from "react-toastify";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../firebase/firebaseConfig", () => ({
  __esModule: true,
  default: { db: {} },
}));

const mockUnsubscribe = jest.fn();
const mockOnSnapshot = jest.fn();

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(() => "mock-collection-ref"), 
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(), 
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  Timestamp: {
    fromDate: (date: Date) => date,
    now: () => new Date(),
  },
}));

jest.mock("@/utils/CurrentUser", () => ({
  GetCurrentUser: () => ({
    user: { id: "my-id", email: "me@sumail.com", name: "Me" },
  }),
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@mui/icons-material/Close", () => {
  return (props: any) => <div data-testid="CloseIcon" onClick={props.onClick} />;
});

describe("ComposeForm Component", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    (collection as jest.Mock).mockReturnValue("mock-collection-ref");

    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: "user1",
          data: () => ({
             name: "Friend", 
             email: "friend@test.com"
          })
        }
      ],
      empty: false,
      size: 1
    });

    mockOnSnapshot.mockImplementation((...args) => {
      const callback = args.find((arg) => typeof arg === "function");
      const fakeSnapshot = {
        docs: [
          {
            id: "user1",
            data: () => ({
              senderId: "user1",
              senderEmail: "friend@test.com",
              email: "friend@test.com",
              name: "Friend",
              receiverId: "my-id",
            }),
          },
        ],
        empty: false,
        size: 1,
      };

      if (callback) {
        callback(fakeSnapshot);
      }
      return mockUnsubscribe;
    });
  });

  it("returns null when openForm is false", () => {
    const { container } = render(<ComposeForm openForm={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders correctly when openForm is true", () => {
    render(<ComposeForm openForm={true} />);
    expect(screen.getByText("Send To")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Write your mail here...")
    ).toBeInTheDocument();
  });

  it("handles input validation and enables submit button", async () => {
    const user = userEvent.setup();
    render(<ComposeForm openForm={true} />);

    const submitBtn = screen.getByRole("button", { name: /send message/i });
    expect(submitBtn).toBeDisabled();

    const inputs = screen.getAllByRole("textbox");
    const receiverInput = inputs[0];
    const subjectInput = inputs[1];
    const contentInput = inputs[2];

    await user.type(receiverInput, "someone@test.com");
    fireEvent.keyDown(receiverInput, { key: "Enter", code: "Enter" });

    await user.type(subjectInput, "Hello");
    await user.type(contentInput, "World");

    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });
  });

  it("shows suggestions and allows selection", async () => {
    const user = userEvent.setup();
    render(<ComposeForm openForm={true} />);

    const receiverInput = screen.getAllByRole("textbox")[0];

    await user.type(receiverInput, "friend");

    await waitFor(() => {
      expect(screen.getByText("friend@test.com")).toBeInTheDocument();
    });

    await user.click(screen.getByText("friend@test.com"));

    expect(screen.getByText("friend@test.com")).toBeInTheDocument();
    expect(screen.getByText("×")).toBeInTheDocument();
  });

  it("submits the form successfully (New Message)", async () => {
    const user = userEvent.setup();
    render(<ComposeForm openForm={true} />);

    const inputs = screen.getAllByRole("textbox");
    const receiverInput = inputs[0];
    const subjectInput = inputs[1];
    const contentInput = inputs[2];

    await user.type(receiverInput, "test@recipient.com");
    fireEvent.keyDown(receiverInput, { key: "Enter", code: "Enter" });
    await user.type(subjectInput, "My Subject");
    await user.type(contentInput, "My Content");

    const submitBtn = screen.getByRole("button", { name: /send message/i });
    await waitFor(() => expect(submitBtn).toBeEnabled());
    
    await user.click(submitBtn);

    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        senderEmail: "me@sumail.com",
        receiverEmail: ["test@recipient.com"],
        title: "My Subject",
        content: "My Content",
      })
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Email has been sent!");
    });

    await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/mail/sent");
    }, { timeout: 2500 });
  });

  it("calls hideModal when close icon is clicked (isModal=true)", async () => {
    const hideModalMock = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ComposeForm 
        openForm={true} 
        isModal={true} 
        hideModal={hideModalMock} 
      />
    );

    const closeIcon = screen.getByTestId("CloseIcon");
    await user.click(closeIcon);
    expect(hideModalMock).toHaveBeenCalled();
  });
});