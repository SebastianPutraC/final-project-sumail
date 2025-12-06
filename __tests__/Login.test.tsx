import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../components/Login";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";
import { FirebaseError } from "firebase/app";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock("../firebase/firebaseConfig", () => ({
  __esModule: true,
  default: {
    auth: {},
  },
}));

jest.mock("firebase/app", () => {
  class MockFirebaseError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = "FirebaseError";
    }
  }
  return {
    FirebaseError: MockFirebaseError,
  };
});

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("react-spinners", () => ({
  ClipLoader: () => <div data-testid="clip-loader">Loading...</div>,
}));

describe("Login Component", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the login form correctly", () => {
    render(<Login />);
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ex. andrew")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeDisabled();
  });

  it("navigates to register page when Register button is clicked", async () => {
    const user = userEvent.setup();
    render(<Login />);
    await user.click(screen.getByRole("button", { name: /register/i }));
    expect(mockPush).toHaveBeenCalledWith("/register");
  });

  it("validates inputs and enables button when form is valid", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const loginButton = screen.getByRole("button", { name: "Login" });
    await user.type(screen.getByPlaceholderText("ex. andrew"), "testuser");
    await user.type(
      screen.getByPlaceholderText("Password must be at least 8 characters"),
      "Password123"
    );

    await waitFor(() => {
      expect(loginButton).toBeEnabled();
    });
  });

it("handles successful login", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<Login />);

    const emailInput = screen.getByPlaceholderText("ex. andrew");
    const passInput = screen.getByPlaceholderText("Password must be at least 8 characters");
    const loginButton = screen.getByRole("button", { name: "Login" });

    await user.type(emailInput, "john");
    await user.type(passInput, "securePass123");

    await waitFor(() => {
      expect(loginButton).toBeEnabled();
    });

    await user.click(loginButton);

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "john@sumail.com",
      "securePass123"
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Login success! You will be redirect to home page"
      );
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockPush).toHaveBeenCalledWith("/mail/inbox");
  });
  it("handles firebase invalid credential error", async () => {
    const user = userEvent.setup();

    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(
      new FirebaseError("auth/invalid-credential", "Invalid login")
    );

    render(<Login />);

    await user.type(screen.getByPlaceholderText("ex. andrew"), "wrong");
    await user.type(
      screen.getByPlaceholderText("Password must be at least 8 characters"),
      "wrongPass123"
    );
    
    const loginButton = screen.getByRole("button", { name: "Login" });
    await waitFor(() => expect(loginButton).toBeEnabled());

    await user.click(loginButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Wrong email or password");
    });
  });
});