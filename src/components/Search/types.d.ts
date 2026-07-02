export interface SearchProps {
  value: string;
  onQueryChange: (value: string) => void;
  loading: boolean;
}
