import { Link } from "react-router-dom";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

interface BlogPostBreadcrumbsProps {
  category: string;
}

export function BlogPostBreadcrumbs({ category }: BlogPostBreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <HomeIcon className="h-4 w-4" />
      </Link>
      <ChevronRightIcon className="h-4 w-4" />
      <Link
        to="/blog"
        className="hover:text-foreground transition-colors"
      >
        Blog
      </Link>
      <ChevronRightIcon className="h-4 w-4" />
      <span className="text-foreground font-medium">{category}</span>
    </nav>
  );
}
