import { FileText } from "lucide-react";

export default function AppLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
        <FileText className="h-4.5 w-4.5" strokeWidth={2.2} />
      </div>
      <h1 className="text-xl font-bold">CollabDoc</h1>
    </div>
  );
}
