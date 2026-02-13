"use client";

import { useMemo } from "react";
import type { ProcessedBrand, Platform } from "@/lib/metricool";
import type { BrandStatus } from "@/lib/types";
import { getBrandStatus } from "@/lib/types";

interface FilterOptions {
  searchQuery: string;
  selectedPlatforms: Platform[];
  selectedStatuses: BrandStatus[];
}

export function useFilteredBrands(
  brands: ProcessedBrand[],
  filters: FilterOptions
) {
  const { searchQuery, selectedPlatforms, selectedStatuses } = filters;

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedPlatforms.length > 0 ||
    selectedStatuses.length > 0;

  const filtered = useMemo(() => {
    if (!hasActiveFilters) return brands;

    return brands.filter((brand) => {
      // Name search: case-insensitive substring
      if (searchQuery.trim()) {
        if (
          !brand.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        ) {
          return false;
        }
      }

      // Platform filter: OR logic (brand has ANY of the selected platforms)
      if (selectedPlatforms.length > 0) {
        if (!selectedPlatforms.some((p) => brand.platforms.includes(p))) {
          return false;
        }
      }

      // Status filter: OR logic
      if (selectedStatuses.length > 0) {
        const { status } = getBrandStatus(brand.platforms);
        if (!selectedStatuses.includes(status)) {
          return false;
        }
      }

      return true;
    });
  }, [brands, searchQuery, selectedPlatforms, selectedStatuses, hasActiveFilters]);

  return { filtered, hasActiveFilters };
}
