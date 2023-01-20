import type { ComponentPropsWithRef } from "react";

export interface SearchProps extends ComponentPropsWithRef<'input'>{ 
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}