import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Register from "../components/Register";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("../firebase/firebaseConfig", () => ({
  auth: {},
  db: {},
}));

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  setDoc: jest.fn(),
  doc: jest.fn(() => "mock-doc-ref"),
  getFirestore: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Register Page", () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the registration form correctly", () => {
    render(<Register />);

    expect(screen.getByText("Sumail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ex. Andrew Sebastian")).toBeInTheDocument();
    
    expect(screen.getByDisplayValue("@sumail.com")).toBeInTheDocument();
    
    const submitBtn = screen.getByRole("button", { name: /register/i });
    expect(submitBtn).toBeDisabled();
  });

  it("validates form input and enables button", async () => {
    render(<Register />);
    
    const nameInput = screen.getByPlaceholderText("ex. Andrew Sebastian");
    const emailInput = screen.getByPlaceholderText("ex. andrew");
    const passwordInput = screen.getByPlaceholderText("Password must be at least 8 characters");
    const roleAdmin = screen.getByLabelText("Admin");

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "johndoe");
    await user.type(passwordInput, "securePassword123");
    await user.click(roleAdmin);

    await waitFor(() => {
      const submitBtn = screen.getByRole("button", { name: /register/i });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  it("successfully registers a user, saves to DB, and redirects", async () => {
    const mockUser = { uid: "12345", email: "johndoe@sumail.com" };
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    render(<Register />);

    await user.click(screen.getByLabelText("User"));
    await user.type(screen.getByPlaceholderText("ex. Andrew Sebastian"), "John Doe");
    await user.type(screen.getByPlaceholderText("ex. andrew"), "johndoe");
    await user.type(
      screen.getByPlaceholderText("Password must be at least 8 characters"),
      "Password123"
    );
    const roleUser = screen.getByLabelText("User");
    await user.click(roleUser);

    const submitBtn = screen.getByRole("button", { name: /register/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "johndoe@sumail.com",
        "Password123"
      );
    });

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        createdAt: expect.any(Date),
        uid: "12345",
        name: "John Doe",
        role: "user",
        email: "johndoe@sumail.com",
      })
    );

    expect(toast.success).toHaveBeenCalledWith("You have successfully registered!");

    expect(mockPush).not.toHaveBeenCalled();
    
    act(() => {
      jest.runAllTimers();
    });

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("handles registration errors gracefully", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(
      new Error("Email already in use")
    );

    render(<Register />);

    await user.click(screen.getByLabelText("Admin"));
    await user.type(screen.getByPlaceholderText("ex. Andrew Sebastian"), "Jane Doe");
    await user.type(screen.getByPlaceholderText("ex. andrew"), "janedoe");
    await user.type(
        screen.getByPlaceholderText("Password must be at least 8 characters"),
        "Password123"
      );
    const roleAdmin = screen.getByLabelText("Admin");
    await user.click(roleAdmin);

    const submitBtn = screen.getByRole("button", { name: /register/i });
    await waitFor(() => expect(submitBtn).toBeDisabled());
  });
  
  it("navigates to login when 'Login' button is clicked", async () => {
    render(<Register />);
    
    const loginBtn = screen.getByRole("button", { name: "Login" });
    
    await user.click(loginBtn);
    
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});