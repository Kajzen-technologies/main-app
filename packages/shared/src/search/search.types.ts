import { MarkerCategory } from "../markers/markerCategory.constants";

export interface MarkerSearchParams {
  query?: string;
  category?: MarkerCategory;
  hasElectricity?: boolean;
  hasWater?: boolean;
  hasInternet?: boolean;
  isOpenOnly?: boolean;
}
