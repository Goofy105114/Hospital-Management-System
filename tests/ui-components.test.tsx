import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

describe("React Testing Library - UI Component Suite", () => {
  it("renders Button with different variants and fires onClick events", () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Confirm Appointment
      </Button>
    );

    const button = screen.getByRole("button", { name: /confirm appointment/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled state in Button component", () => {
    const handleClick = vi.fn();
    render(
      <Button variant="secondary" disabled onClick={handleClick}>
        Disabled Action
      </Button>
    );

    const button = screen.getByRole("button", { name: /disabled action/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders Badge component with appropriate variant classes", () => {
    const { rerender } = render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();

    rerender(<Badge variant="error">High Risk Allergen</Badge>);
    expect(screen.getByText("High Risk Allergen")).toBeInTheDocument();
  });

  it("renders Card container with header and content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Vitals Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Blood Pressure: 120/80 mmHg</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText("Vitals Summary")).toBeInTheDocument();
    expect(screen.getByText("Blood Pressure: 120/80 mmHg")).toBeInTheDocument();
  });

  it("renders TanStack DataTable correctly with columns and rows", () => {
    interface TestItem {
      id: string;
      code: string;
      name: string;
    }

    const testData: TestItem[] = [
      { id: "1", code: "MED-01", name: "Amoxicillin" },
      { id: "2", code: "MED-02", name: "Ibuprofen" },
    ];

    const testColumns: ColumnDef<TestItem>[] = [
      {
        accessorKey: "code",
        header: "Med Code",
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: "name",
        header: "Med Name",
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
    ];

    render(
      <DataTable
        columns={testColumns}
        data={testData}
        searchKey="name"
        searchPlaceholder="Filter items..."
      />
    );

    expect(screen.getByText("Med Code")).toBeInTheDocument();
    expect(screen.getByText("Med Name")).toBeInTheDocument();
    expect(screen.getByText("Amoxicillin")).toBeInTheDocument();
    expect(screen.getByText("Ibuprofen")).toBeInTheDocument();
    expect(screen.getByText(/total records:/i)).toBeInTheDocument();
  });
});
