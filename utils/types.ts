import { SvgIconProps } from "@mui/material/SvgIcon";

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  name: string;
  role: "admin" | "user";
}

export interface MessageProps {
  id: string;
  senderId: string;
  senderEmail?: string;
  senderName?: string;
  receiverId: string;
  receiverEmail?: string;
  replyFromMessageId?: string[] | string;
  title: string;
  content: string;
  sentDate: Date;
  starred?: boolean;
}

export interface MessageListProps {
  type?: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface FormattedUsers {
  id: string;
  name: string;
}

export interface Receiver {
  id?: string | undefined;
  email?: string | undefined;
  name?: string | undefined;
}

export interface MessageData {
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId: string;
}

export interface FormValues {
  receiver: string;
  subject: string;
  content?: string;
}

export interface ComposeProps {
  receiverEmail: string;
  title: string;
  content: string;
}

export interface SidebarLinkProps {
  checkPath: boolean;
  Icon: React.ComponentType<SvgIconProps>;
  path: string;
}
