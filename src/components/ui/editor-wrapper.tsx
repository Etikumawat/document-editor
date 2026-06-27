"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("~/components/ui/editor"), { ssr: false });

interface Props {
  documentId: string;
  initialContent: string;
  initialTitle: string;
  role: string;
  userName: string;
}

export default function EditorWrapper(props: Props) {
  return <Editor {...props} />;
}
