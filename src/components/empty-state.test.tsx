import { render, screen } from "@testing-library/react";
import { SproutIcon } from "lucide-react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("mostra título como heading, descrição e ações", () => {
    render(
      <EmptyState icon={SproutIcon} title="Seu dia ainda está livre." description="Comece pequeno.">
        <button type="button">Criar hábito</button>
      </EmptyState>,
    );

    expect(screen.getByRole("heading", { name: "Seu dia ainda está livre." })).toBeInTheDocument();
    expect(screen.getByText("Comece pequeno.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar hábito" })).toBeInTheDocument();
  });
});
