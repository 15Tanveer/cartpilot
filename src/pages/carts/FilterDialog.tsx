import React, { useState } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Button,
  Row,
  Col,
  App as AntdApp,
} from "antd";
import { DeleteFilled, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  CART_FILTER_COLUMNS,
  IFilterCondition,
  getColumnType,
  getDefaultOperator,
  getOperatorsForType,
} from "./cart.filters";

interface IFilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: IFilterCondition[]) => void;
  initialFilters?: IFilterCondition[];
}

const emptyCondition = (): IFilterCondition => ({
  columnName: "",
  operator: "",
  value: "",
});

const FilterDialog: React.FC<IFilterDialogProps> = ({
  open,
  onClose,
  onApply,
  initialFilters = [],
}) => {
  const { message } = AntdApp.useApp();
  const [filters, setFilters] = useState<IFilterCondition[]>([emptyCondition()]);

  // Re-seed the dialog from the currently applied filters when it opens.
  const handleAfterOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setFilters(
        initialFilters.length > 0 ? initialFilters : [emptyCondition()],
      );
    }
  };

  // Columns not yet chosen by another row (each column filterable once).
  const getAvailableColumns = (currentIndex: number) => {
    const taken = filters
      .map((f, idx) => (idx !== currentIndex ? f.columnName : null))
      .filter(Boolean);
    return CART_FILTER_COLUMNS.filter((col) => !taken.includes(col.field));
  };

  const handleAddFilter = () => setFilters([...filters, emptyCondition()]);

  const handleRemoveFilter = (index: number) =>
    setFilters(filters.filter((_, i) => i !== index));

  const handleFilterChange = (
    index: number,
    field: keyof IFilterCondition,
    value: string,
  ) => {
    const next = [...filters];
    if (field === "columnName") {
      const type = getColumnType(value);
      next[index] = {
        columnName: value,
        operator: getDefaultOperator(type),
        value: "",
      };
    } else {
      next[index] = { ...next[index], [field]: value };
    }
    setFilters(next);
  };

  const handleApply = () => {
    const nonEmpty = filters.filter(
      (f) => f.columnName || f.value || (f.operator && f.operator !== ""),
    );

    if (nonEmpty.length === 0) {
      onApply([]);
      onClose();
      return;
    }

    const hasInvalid = nonEmpty.some(
      (f) => !f.columnName || !f.operator || f.value === "",
    );
    if (hasInvalid) {
      message.warning("Please fill in all filter fields completely");
      return;
    }

    onApply(nonEmpty);
    onClose();
  };

  const handleReset = () => {
    setFilters([emptyCondition()]);
    onApply([]);
    onClose();
  };

  const renderValueInput = (filter: IFilterCondition, index: number) => {
    const type = getColumnType(filter.columnName);

    if (type === "number") {
      return (
        <InputNumber
          placeholder="Enter value"
          value={filter.value === "" ? null : Number(filter.value)}
          onChange={(value) =>
            handleFilterChange(index, "value", value == null ? "" : String(value))
          }
          style={{ width: "100%" }}
        />
      );
    }

    if (type === "date") {
      return (
        <DatePicker
          value={filter.value ? dayjs(filter.value) : null}
          onChange={(d) =>
            handleFilterChange(index, "value", d ? d.toISOString() : "")
          }
          style={{ width: "100%" }}
        />
      );
    }

    return (
      <Input
        placeholder="Enter value"
        value={filter.value}
        onChange={(e) => handleFilterChange(index, "value", e.target.value)}
      />
    );
  };

  return (
    <Modal
      title="Add Filters"
      open={open}
      onCancel={onClose}
      afterOpenChange={handleAfterOpenChange}
      width={800}
      footer={[
        <Button key="reset" onClick={handleReset}>
          Reset
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Apply
        </Button>,
      ]}
    >
      <Form layout="vertical">
        {filters.map((filter, index) => {
          const type = getColumnType(filter.columnName);
          return (
            <div
              key={index}
              style={{
                marginBottom: 16,
                padding: 16,
                border: "1px solid #f0f0f0",
                borderRadius: 4,
                backgroundColor: "#fafafa",
              }}
            >
              <Row gutter={16} align="middle">
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={index === 0 ? "Column" : undefined}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder="Select column"
                      value={filter.columnName || undefined}
                      onChange={(value) =>
                        handleFilterChange(index, "columnName", value)
                      }
                      options={getAvailableColumns(index).map((col) => ({
                        label: col.label,
                        value: col.field,
                      }))}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label={index === 0 ? "Operator" : undefined}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder="Select operator"
                      value={filter.operator || undefined}
                      onChange={(value) =>
                        handleFilterChange(index, "operator", value)
                      }
                      options={getOperatorsForType(type)}
                      disabled={!filter.columnName}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={20} sm={6}>
                  <Form.Item
                    label={index === 0 ? "Value" : undefined}
                    style={{ marginBottom: 0 }}
                  >
                    {renderValueInput(filter, index)}
                  </Form.Item>
                </Col>

                <Col xs={4} sm={2}>
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: index === 0 ? 30 : 0,
                    }}
                  >
                    {filters.length > 1 && (
                      <DeleteFilled
                        style={{
                          cursor: "pointer",
                          color: "#ff4d4f",
                          fontSize: 16,
                        }}
                        onClick={() => handleRemoveFilter(index)}
                      />
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          );
        })}

        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={handleAddFilter}
          disabled={filters.length >= CART_FILTER_COLUMNS.length}
          style={{ marginTop: 8 }}
        >
          Add More Filter
        </Button>
      </Form>
    </Modal>
  );
};

export default FilterDialog;
