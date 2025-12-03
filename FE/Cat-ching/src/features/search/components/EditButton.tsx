import { Pencil } from "lucide-react";

interface EditButtonProps {
  onClick: () => void;
  className?: string;
}

export const EditButton = ({ onClick, className }: EditButtonProps) => {
  return (
    <Pencil
      size={16}
      className={`text-gray-400 cursor-pointer hover:text-blue-600 ${
        className || ""
      }`}
      onClick={onClick}
    />
  );
};
