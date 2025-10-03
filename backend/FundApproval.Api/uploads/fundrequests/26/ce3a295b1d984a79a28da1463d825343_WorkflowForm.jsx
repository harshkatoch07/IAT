import React, { useEffect, useState, useCallback } from "react";
import { Form, Input, Select, Button, message, Card, Spin, Switch } from "antd";
import { createWorkflow, getWorkflowById, updateWorkflow, getDesignations } from "../../../api/workflowApi";
import { useNavigate, useParams } from "react-router-dom";

const { Option } = Select;

export default function WorkflowForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]); // [{id,name}]
  const [finalReceiverUsers, setFinalReceiverUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // ✅ FIX: pass a STRING to getDesignations (not an object)
  const fetchDesignations = useCallback(
    async (search = "") => {
      try {
        const data = await getDesignations(search); // <-- only string "q"
        setDesignations(data);
      } catch {
        message.error("Failed to load designations");
      }
    },
    [] // no deps needed
  );

  const loadWorkflow = useCallback(
    async (workflowId) => {
      try {
        setLoading(true);
        const workflow = await getWorkflowById(workflowId, token);
        form.setFieldsValue({
          name: workflow.name,
          description: workflow.description,
          departmentId: workflow.departmentId ?? 0,
          initiatorDesignationId: workflow.initiatorDesignationId ?? undefined,   // ✅ ID
          initiatorSlaHours: workflow.initiatorSlaHours || 0,                     // ✅ camelCase
          template: workflow.template,
          textBoxName: workflow.textBoxName,
          steps: (workflow.steps || [])
            .filter((s) => s.stepName !== "Initiator")
            .map((s) => ({
              stepName: s.stepName,
              slaHours: s.slaHours ?? s.SLAHours ?? 0,
              designationId: s.designationId,                                     // ✅ ID
              autoApprove: s.autoApprove ?? false,
            })),
          finalReceivers: workflow.finalReceivers?.map((r) => r.userId) || [],
          isActive: workflow.isActive !== undefined ? workflow.isActive : true,
        });
        if (workflow.finalReceivers?.length) {
          setFinalReceiverUsers(workflow.finalReceivers);
        }
      } catch {
        message.error("Failed to load workflow");
      } finally {
        setLoading(false);
      }
    },
    [form, token]
  );

  useEffect(() => {
    fetch("http://localhost:5292/api/admin/departments", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const normalized = data.map((d) => ({
          departmentId: d.id ?? d.departmentId ?? 0,
          departmentName: d.name ?? d.departmentName ?? String(d.id ?? d.departmentId ?? "Unknown"),
        }));
        setDepartments(normalized);
      })
      .catch(() => message.error("Failed to load departments"));

    // Load initial designation list
    fetchDesignations("");

    if (id && id !== "new") loadWorkflow(id);
  }, [fetchDesignations, loadWorkflow, id, token]);

  const fetchUsersByDesignationId = async (designationId) => {
    if (!designationId) return setFinalReceiverUsers([]);
    try {
      const res = await fetch(
        `http://localhost:5292/api/admin/users?designationId=${encodeURIComponent(designationId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setFinalReceiverUsers(data);
    } catch {
      message.error("Failed to load users");
    }
  };

  const handleSubmit = async (values) => {
    const approvers = (values.steps || []).map((step, index) => ({
      stepName: step.stepName || `Approver ${index + 1}`,
      designationId: step.designationId,                 // ✅ send ID
      slaHours: step.slaHours || 0,
      autoApprove: step.autoApprove || false,
    }));

    const workflowData = {
      name: values.name,
      description: values.description,
      departmentId: values.departmentId ?? 0,
      initiatorDesignationId: values.initiatorDesignationId, // ✅ required by API
      initiatorSlaHours: values.initiatorSlaHours || 0,       // ✅ camelCase
      approvers,
      finalReceivers: (values.finalReceivers || []).map((userId) => ({ userId })), // designationId optional
      isActive: values.isActive === undefined ? true : values.isActive,
      template: values.template,
      textBoxName: values.textBoxName,
    };

    try {
      if (id && id !== "new") {
        await updateWorkflow(id, workflowData, token);
        message.success("Workflow updated");
      } else {
        await createWorkflow(workflowData, token);
        message.success("Workflow created");
      }
      navigate("/admin/workflows");
    } catch (error) {
      console.error("Workflow Save Error:", error);
      message.error(id && id !== "new" ? "Failed to update workflow" : "Failed to create workflow");
    }
  };

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div style={{ padding: 32 }}>
      <h2>{id && id !== "new" ? "Edit Workflow" : "Create Workflow"}</h2>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="Workflow Name" rules={[{ required: true, message: "'name' is required" }]}>
          <Input />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input />
        </Form.Item>

        <Form.Item name="departmentId" label="Workflow Department">
          <Select allowClear placeholder="Select Department">
            {departments.map((d) => (
              <Option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="initiatorDesignationId"
          label="Initiator Designation"
          rules={[{ required: true, message: "Please select initiator designation!" }]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Select Designation"
            onSearch={fetchDesignations}     // ✅ will pass a string search term
            filterOption={false}
            optionFilterProp="label"
          >
            {designations.map((d) => (
              <Option key={d.id} value={d.id} label={d.name}>
                {d.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="initiatorSlaHours" label="Initiator SLA (Hours)">
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item name="template" label="Template">
          <Input />
        </Form.Item>

        <Form.Item name="textBoxName" label="Textbox Name">
          <Input />
        </Form.Item>

        <Form.List name="steps">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Card key={key} style={{ marginBottom: 16 }}>
                  <Form.Item label="Step Name" name={[name, "stepName"]} rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="SLA (Hours)" name={[name, "slaHours"]}>
                    <Input type="number" min={0} />
                  </Form.Item>
                  <Form.Item
                    label="Designation"
                    name={[name, "designationId"]}
                    rules={[{ required: true, message: "Please select a designation" }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select Designation"
                      onSearch={fetchDesignations} // ✅ string search term
                      filterOption={false}
                      optionFilterProp="label"
                    >
                      {designations.map((d) => (
                        <Option key={d.id} value={d.id} label={d.name}>
                          {d.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Button danger onClick={() => remove(name)}>
                    Remove Step
                  </Button>
                </Card>
              ))}
              <Button type="dashed" onClick={() => add()} block>
                + Add Approver Step
              </Button>
            </>
          )}
        </Form.List>

        <Card title="Final Receivers" style={{ marginTop: 24 }}>
          <Form.Item label="Designation" name="finalReceiverDesignationId">
            <Select
              placeholder="Select Designation"
              onChange={fetchUsersByDesignationId}
              showSearch
              onSearch={fetchDesignations} // ✅ string search term
              filterOption={false}
              optionFilterProp="label"
            >
              {designations.map((d) => (
                <Option key={d.id} value={d.id} label={d.name}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="finalReceivers" label="Select Final Receivers">
            <Select mode="multiple" placeholder="Select Users" allowClear>
              {finalReceiverUsers.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.fullName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        <Form.Item name="isActive" label="Status" valuePropName="checked" initialValue={true}>
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>

        <div style={{ display: "flex", gap: 16 }}>
          <Button type="primary" htmlType="submit">
            {id && id !== "new" ? "Update Workflow" : "Create Workflow"}
          </Button>
          <Button onClick={() => navigate("/admin/workflows")} type="default" style={{ marginLeft: 8 }}>
            Close
          </Button>
        </div>
      </Form>
    </div>
  );
}
