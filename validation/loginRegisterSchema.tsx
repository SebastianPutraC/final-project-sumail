import * as yup from "yup";

export const registerSchema = yup.object().shape({
  name: yup
    .string()
    .required("Full name is required")
    .min(3, "Name must be at least 3 characters"),
  email: yup.string().required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must include at least 1 uppercase letter")
    .matches(/[0-9]/, "Password must include at least 1 number"),
  role: yup
    .mixed<"admin" | "user">()
    .oneOf(["admin", "user"], "Role is required")
    .required("Role is required"),
});

export const loginSchema = yup.object().shape({
  email: yup.string().required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must include at least 1 uppercase letter")
    .matches(/[0-9]/, "Password must include at least 1 number"),
});
