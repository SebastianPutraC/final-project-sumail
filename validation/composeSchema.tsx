import * as yup from "yup";

export const composeSchema = yup.object().shape({
  receiver: yup.array().required("Receiver email is required"),
  subject: yup.string().required("Subject is required"),
  content: yup.string(),
});
