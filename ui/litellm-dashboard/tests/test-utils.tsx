import React, { PropsWithChildren } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter, OnUrlUpdateFunction } from "nuqs/adapters/testing";

// Create a client for testing
export const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
    mutations: {
      retry: false,
    },
  },
});

interface ProviderOptions {
  searchParams?: string | Record<string, string> | URLSearchParams;
  onUrlUpdate?: OnUrlUpdateFunction;
}

export const renderWithProviders = (ui: React.ReactElement, options?: RenderOptions & ProviderOptions) => {
  // A caller-supplied wrapper nests inside these providers rather than replacing
  // them, so passing one cannot silently strip the URL and query clients out.
  const { searchParams, onUrlUpdate, wrapper: Wrapper, ...renderOptions } = options ?? {};
  const Providers: React.FC<PropsWithChildren> = ({ children }) => (
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate} hasMemory>
      <QueryClientProvider client={testQueryClient}>
        {Wrapper ? <Wrapper>{children}</Wrapper> : children}
      </QueryClientProvider>
    </NuqsTestingAdapter>
  );
  return render(ui, { wrapper: Providers, ...renderOptions });
};

export * from "@testing-library/react";
