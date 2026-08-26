import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VectorStoreManagement from "./index";
import { vectorStoreListCall } from "@/components/networking";

vi.mock("@/components/networking", () => ({
  vectorStoreListCall: vi.fn(),
  vectorStoreDeleteCall: vi.fn(),
  credentialListCall: vi.fn().mockResolvedValue({ credentials: [] }),
  modelHubCall: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("./vector_store_info", () => ({
  __esModule: true,
  default: ({ vectorStoreId, onClose }: { vectorStoreId: string; onClose: () => void }) => (
    <div data-testid="vector-store-info" data-vector-store-id={vectorStoreId}>
      <button data-testid="vector-store-info-close" onClick={onClose} />
    </div>
  ),
}));

vi.mock("./VectorStoreTable", () => ({
  __esModule: true,
  default: ({ onView }: { onView: (id: string) => void }) => (
    <div data-testid="vector-store-table">
      <button data-testid="view-vs-1" onClick={() => onView("vs-1")} />
    </div>
  ),
}));

vi.mock("./CreateVectorStore", () => ({ __esModule: true, default: () => null }));
vi.mock("./TestVectorStoreTab", () => ({ __esModule: true, default: () => null }));
vi.mock("./IndexesTab", () => ({ __esModule: true, default: () => null }));

const defaultProps = { accessToken: "sk-test", userID: "user-1", userRole: "Admin" };

describe("VectorStoreManagement URL routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vectorStoreListCall).mockResolvedValue({ data: [] });
  });

  it("should open the vector store info view from a ?vector_store= deep link", async () => {
    renderWithProviders(<VectorStoreManagement {...defaultProps} />, { searchParams: "?vector_store=vs-9" });
    expect(await screen.findByTestId("vector-store-info")).toHaveAttribute("data-vector-store-id", "vs-9");
  });

  it("should write ?vector_store= on view click and clear it on close", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    renderWithProviders(<VectorStoreManagement {...defaultProps} />, { onUrlUpdate });

    await user.click(screen.getByRole("tab", { name: "Manage Vector Stores" }));
    await user.click(await screen.findByTestId("view-vs-1"));
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get("vector_store")).toBe("vs-1");
    expect(onUrlUpdate.mock.calls.at(-1)?.[0].options.history).toBe("push");

    await user.click(screen.getByTestId("vector-store-info-close"));
    await waitFor(() => expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.has("vector_store")).toBe(false));
  });
});
