import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Register from "../components/Register";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

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
  auth: {}, // dummy object
  db: {},   // dummy object
}));

// 3. Mock Firebase Auth & Firestore functions
jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  setDoc: jest.fn(),
  doc: jest.fn(() => "mock-doc-ref"),
  getFirestore: jest.fn(),
}));

// 4. Mock Toastify to avoid UI errors and check calls
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// 5. Mock the Schema if you want to bypass strict validation rules, 
// OR ensure the inputs in the test match your actual schema.
// We will assume your schema requires: name, email, password > 8 chars, and role.

describe("Register Page", () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Take control of setTimeout
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the registration form correctly", () => {
    render(<Register />);

    expect(screen.getByText("Sumail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ex. Andrew Sebastian")).toBeInTheDocument();
    
    // Check for the implicit domain
    expect(screen.getByDisplayValue("@sumail.com")).toBeInTheDocument();
    
    // Button should be disabled initially (because form is invalid)
    const submitBtn = screen.getByRole("button", { name: /register/i });
    expect(submitBtn).toBeDisabled();
  });

  it("validates form input and enables button", async () => {
    render(<Register />);
    
    const nameInput = screen.getByPlaceholderText("ex. Andrew Sebastian");
    const emailInput = screen.getByPlaceholderText("ex. andrew");
    const passwordInput = screen.getByPlaceholderText("Password must be at least 8 characters");
    const roleAdmin = screen.getByLabelText("Admin");

    // Type valid data
    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "johndoe"); // logic adds @sumail.com later
    await user.type(passwordInput, "securePassword123");
    await user.click(roleAdmin);

    // Wait for validation to pass (react-hook-form is async)
    await waitFor(() => {
      const submitBtn = screen.getByRole("button", { name: /register/i });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  it("successfully registers a user, saves to DB, and redirects", async () => {
    // 1. Setup Mocks for Success
    const mockUser = { uid: "12345", email: "johndoe@sumail.com" };
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    render(<Register />);

    // 2. Fill Form
    await user.click(screen.getByLabelText("User")); // Select Role
    await user.type(screen.getByPlaceholderText("ex. Andrew Sebastian"), "John Doe");
    await user.type(screen.getByPlaceholderText("ex. andrew"), "johndoe");
    await user.type(
      screen.getByPlaceholderText("Password must be at least 8 characters"),
      "Password123"
    );
    const roleUser = screen.getByLabelText("User");
    await user.click(roleUser);

    // 3. Submit
    const submitBtn = screen.getByRole("button", { name: /register/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled()); // Ensure valid
    await user.click(submitBtn);

    // 4. Assert Loading State (Optional, hard to catch with async, but can check button text)
    // You might see the spinner, or "Register" disappears.

    // 5. Assert Firebase Auth Call
    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "johndoe@sumail.com", // Check if domain was appended
        "Password123"
      );
    });

    // 6. Assert Firestore Call
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), // The doc() result (mocked)
      expect.objectContaining({
        createdAt: expect.any(Date),
        uid: "12345",
        name: "John Doe",
        role: "user",
        email: "johndoe@sumail.com",
      })
    );

    // 7. Assert Success Toast
    expect(toast.success).toHaveBeenCalledWith("You have successfully registered!");

    // 8. Assert Navigation Redirect (Handles setTimeout)
    expect(mockPush).not.toHaveBeenCalled(); // Shouldn't be called immediately
    
    act(() => {
      jest.runAllTimers(); // Fast-forward the 1000ms timeout
    });

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("handles registration errors gracefully", async () => {
    // 1. Setup Mock for Failure
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(
      new Error("Email already in use")
    );

    render(<Register />);

    // 2. Fill Form
    await user.click(screen.getByLabelText("Admin"));
    await user.type(screen.getByPlaceholderText("ex. Andrew Sebastian"), "Jane Doe");
    await user.type(screen.getByPlaceholderText("ex. andrew"), "janedoe");
    await user.type(
        screen.getByPlaceholderText("Password must be at least 8 characters"),
        "Password123"
      );
    const roleAdmin = screen.getByLabelText("Admin");
    await user.click(roleAdmin);

    // 3. Submit
    const submitBtn = screen.getByRole("button", { name: /register/i });
    await waitFor(() => expect(submitBtn).toBeDisabled());
  });
  
  it("navigates to login when 'Login' button is clicked", async () => {
    render(<Register />);
    
    // There are two buttons, one is submit, one is "Login" (styled as button or link?)
    // In your code it is a <button> with text "Login"
    const loginBtn = screen.getByRole("button", { name: "Login" });
    
    await user.click(loginBtn);
    
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});