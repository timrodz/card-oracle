export interface ScryfallCardSearchParams {
  query: string;
}

type ColorIdentiy = "red" | "white" | "black" | "green" | "colorless" | "blue";

export interface ScryfallCardFiltererParams {
  filters: {
    mana_cost?: number;
    color_identity?: ColorIdentiy[];
    set_name?: string;
  };
}
