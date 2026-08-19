import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { tagDeleteCall, tagListCall } from "@/components/networking";

import TagManagement from "./index";

vi.mock("@/components/networking", () => ({
  tagListCall: vi.fn(),
  tagCreateCall: vi.fn(),
  tagDeleteCall: vi.fn(),
  modelInfoCall: vi.fn(),
}));

vi.mock("./TagTable", () => ({
  __esModule: true,
  default: ({ isLoading, onDelete }: { isLoading?: boolean; onDelete: (tagName: string) => void }) => (
    <div data-testid="tag-table">
      {isLoading ? "table-loading" : "table-loaded"}
      <button data-testid="mock-delete-trigger" onClick={() => onDelete("test-tag")}>
        trigger
      </button>
    </div>
  ),
}));

vi.mock("./tag_info", () => ({
  __esModule: true,
  default: ({ tagId, onClose }: { tagId: string; onClose: () => void }) => (
    <div data-testid="tag-info" data-tag-id={tagId}>
      <button data-testid="tag-info-close" onClick={onClose} />
    </div>
  ),
}));

vi.mock("./components/CreateTagModal", () => ({
  __esModule: true,
  default: () => <div>Mock Create Tag Modal</div>,
}));

const mockTagListCall = vi.mocked(tagListCall);
const mockTagDeleteCall = vi.mocked(tagDeleteCall);

describe("TagManagement loading state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve the loading state when accessToken is null instead of showing the skeleton forever", async () => {
    renderWithProviders(<TagManagement accessToken={null} userID={null} userRole={null} />);
    expect(await screen.findByText("table-loaded")).toBeInTheDocument();
    expect(mockTagListCall).not.toHaveBeenCalled();
  });

  it("should show the loading state until the tag fetch settles", async () => {
    let resolveFetch: (value: Record<string, never>) => void = () => {};
    mockTagListCall.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    renderWithProviders(<TagManagement accessToken="sk-test" userID="user-1" userRole="Admin" />);
    expect(screen.getByText("table-loading")).toBeInTheDocument();

    resolveFetch({});
    expect(await screen.findByText("table-loaded")).toBeInTheDocument();
    expect(mockTagListCall).toHaveBeenCalledWith("sk-test");
  });
});

describe("TagManagement delete flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTagListCall.mockResolvedValue({});
  });

  it("should confirm deletion through the shared DeleteResourceModal and call tagDeleteCall with the tag name", async () => {
    const user = userEvent.setup();
    mockTagDeleteCall.mockResolvedValue({});
    renderWithProviders(<TagManagement accessToken="sk-test" userID="user-1" userRole="Admin" />);
    await screen.findByText("table-loaded");

    expect(screen.queryByText("Tag Information")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("mock-delete-trigger"));

    expect(await screen.findByText("Tag Information")).toBeInTheDocument();
    expect(screen.getByText("test-tag")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(mockTagDeleteCall).toHaveBeenCalledWith("sk-test", "test-tag");
  });

  it("should not call tagDeleteCall when the deletion is cancelled", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TagManagement accessToken="sk-test" userID="user-1" userRole="Admin" />);
    await screen.findByText("table-loaded");

    await user.click(screen.getByTestId("mock-delete-trigger"));
    await screen.findByText("Tag Information");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockTagDeleteCall).not.toHaveBeenCalled();
  });
});

describe("TagManagement URL routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTagListCall.mockResolvedValue({});
  });

  it("should open the tag info view from a ?tag= deep link", async () => {
    renderWithProviders(<TagManagement accessToken="sk-test" userID="user-1" userRole="Admin" />, {
      searchParams: "?tag=prod-tag",
    });
    expect(await screen.findByTestId("tag-info")).toHaveAttribute("data-tag-id", "prod-tag");
  });

  it("should clear ?tag= from the URL when the info view is closed", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    renderWithProviders(<TagManagement accessToken="sk-test" userID="user-1" userRole="Admin" />, {
      searchParams: "?tag=prod-tag",
      onUrlUpdate,
    });

    await user.click(await screen.findByTestId("tag-info-close"));
    await screen.findByText("table-loaded");
    expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.has("tag")).toBe(false);
  });
});
