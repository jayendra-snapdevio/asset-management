import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

interface PaginationProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: string) => void;
  itemName?: string;
  showShowing?: boolean;
  className?: string;
}

export function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  itemName = "items",
  showShowing = true,
  className,
}: PaginationProps) {
  if (pagination.totalPages === 0) return null;

  return (
    <div className={cn("px-6 py-4 border-t", className)}>
      <div className="flex flex-col md:flex-row justify-between w-full items-center gap-4">
        {showShowing ? (
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} {itemName}
          </p>
        ) : (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Page {pagination.page} of {pagination.totalPages}
          </div>
        )}

        <div className="flex flex-row items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Rows per page:
          </span>
          <Select
            value={pagination.limit.toString()}
            onValueChange={onLimitChange}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

      <div className="flex flex-rows items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {showShowing && (
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      </div>
    </div>
  );
}
