import React, { useState, useEffect } from "react";
import {
    Modal,
    Form,
    Input,
    Select,
    Steps,
    Button,
    TimePicker,
    Card,
    Descriptions,
    message,
} from "antd";
import { useCreate, useUpdate, useList } from "@refinedev/core";
import { useOrganization } from "../../contexts/organization";
import { getRuleTypeDetails, RULE_TYPES } from "./utils";
import dayjs from "dayjs";

const { Option } = Select;

export const RuleForm = ({ visible, onCancel, initialValues }: { visible: boolean, onCancel: () => void, initialValues?: any }) => {
    const { activeOrgId } = useOrganization();
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const { mutate: mutateCreate, mutation: createMutation } = useCreate();
    const { mutate: mutateUpdate, mutation: updateMutation } = useUpdate();
    const isCreating = createMutation?.isPending || false;
    const isUpdating = updateMutation?.isPending || false;
    const [formValues, setFormValues] = useState<any>(initialValues || {});

    const ruleType = Form.useWatch("rule_type", form);

    const devicesQuery = useList({
        resource: "devices",
        filters: [{ field: "organization_id", operator: "eq", value: activeOrgId }],
    });
    const devicesData = devicesQuery.query?.data?.data || [];

    const geofencesQuery = useList({
        resource: "geofences",
        filters: [{ field: "organization_id", operator: "eq", value: activeOrgId }],
    });
    const geofencesData = geofencesQuery.query?.data?.data || [];

    useEffect(() => {
        if (initialValues) {
            let configValues = initialValues.config || {};

            form.setFieldsValue({
                name: initialValues.name,
                description: initialValues.description,
                device_id: initialValues.device_id || "all",
                rule_type: initialValues.rule_type,
                config_geofence_id: configValues.geofence_id,
                config_field: configValues.field,
                config_operator: configValues.operator,
                config_value: configValues.value,
                config_start_hour: configValues.start_hour != null ? dayjs().hour(configValues.start_hour).minute(0) : dayjs().hour(22).minute(0),
                config_end_hour: configValues.end_hour != null ? dayjs().hour(configValues.end_hour).minute(0) : dayjs().hour(6).minute(0),
            });
            setFormValues(form.getFieldsValue(true));
        }
    }, [initialValues, form]);

    const handleNext = async () => {
        try {
            if (currentStep === 0) {
                await form.validateFields(["name", "description", "device_id"]);
            } else if (currentStep === 1) {
                const currentRuleType = form.getFieldValue("rule_type");
                const fieldsToValidate = ["rule_type"];
                if (currentRuleType === "geofence_enter" || currentRuleType === "geofence_exit") {
                    fieldsToValidate.push("config_geofence_id");
                } else if (currentRuleType === "sensor_threshold") {
                    fieldsToValidate.push("config_field", "config_operator", "config_value");
                } else if (currentRuleType === "night_movement") {
                    fieldsToValidate.push("config_start_hour", "config_end_hour");
                }
                await form.validateFields(fieldsToValidate);
            }
            setFormValues(form.getFieldsValue(true));
            setCurrentStep(currentStep + 1);
        } catch (e) {
            console.error("Form validation failed:", e);
        }
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleFinish = async () => {
        try {
            await form.validateFields();
            const values = form.getFieldsValue(true);

            let config: any = {};
            if (values.rule_type === "geofence_enter" || values.rule_type === "geofence_exit") {
                config = { geofence_id: values.config_geofence_id };
            } else if (values.rule_type === "sensor_threshold") {
                config = {
                    field: values.config_field,
                    operator: values.config_operator,
                    value: Number(values.config_value),
                };
            } else if (values.rule_type === "night_movement") {
                config = {
                    start_hour: values.config_start_hour?.hour() || 22,
                    end_hour: values.config_end_hour?.hour() || 6,
                };
            } else if (values.rule_type === "weekend_movement") {
                config = {};
            }

            const payload = {
                organization_id: activeOrgId,
                device_id: values.device_id === "all" ? null : values.device_id,
                name: values.name,
                description: values.description,
                rule_type: values.rule_type,
                config,
                is_active: initialValues ? initialValues.is_active : true,
            };

            if (initialValues?.id) {
                mutateUpdate(
                    { resource: "rules", id: initialValues.id, values: payload },
                    { onSuccess: () => { message.success("Rule updated successfully"); onCancel(); } }
                );
            } else {
                mutateCreate(
                    { resource: "rules", values: payload },
                    { onSuccess: () => { message.success("Rule created successfully"); onCancel(); } }
                );
            }
        } catch (e) {
            // Validation error
        }
    };

    const steps = [
        { title: "Basic Info" },
        { title: "Condition" },
        { title: "Review" },
    ];

    return (
        <Modal
            title={initialValues ? "Edit Rule" : "Add Rule"}
            open={visible}
            onCancel={onCancel}
            footer={[
                currentStep > 0 && (
                    <Button key="back" onClick={handlePrev}>
                        Back
                    </Button>
                ),
                currentStep < steps.length - 1 && (
                    <Button key="next" type="primary" onClick={handleNext}>
                        Next
                    </Button>
                ),
                currentStep === steps.length - 1 && (
                    <Button
                        key="submit"
                        type="primary"
                        loading={isCreating || isUpdating}
                        onClick={handleFinish}
                    >
                        Save Rule
                    </Button>
                ),
            ].filter(Boolean)}
            width={600}
        >
            <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

            <Form form={form} layout="vertical">
                <div style={{ display: currentStep === 0 ? "block" : "none" }}>
                    <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="device_id" label="Apply to" initialValue="all">
                        <Select>
                            <Option value="all">All devices</Option>
                            {devicesData.map((device: any) => (
                                <Option key={device.id} value={device.id}>
                                    {device.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </div>

                <div style={{ display: currentStep === 1 ? "block" : "none" }}>
                    <Form.Item name="rule_type" label="Rule Type" rules={[{ required: true }]}>
                        <Select>
                            {RULE_TYPES.map((rt) => (
                                <Option key={rt.value} value={rt.value}>
                                    {rt.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {(ruleType === "geofence_enter" || ruleType === "geofence_exit") && (
                        <Form.Item
                            name="config_geofence_id"
                            label="Select Geofence"
                            rules={[{ required: true }]}
                        >
                            <Select>
                                {geofencesData.map((gf: any) => (
                                    <Option key={gf.id} value={gf.id}>
                                        {gf.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    {ruleType === "sensor_threshold" && (
                        <>
                            <Form.Item
                                name="config_field"
                                label="Payload Field"
                                rules={[{ required: true }]}
                                help="Field must match a key in the device message payload JSON"
                            >
                                <Input placeholder="e.g. temperature" />
                            </Form.Item>
                            <Form.Item
                                name="config_operator"
                                label="Operator"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Option value=">">&gt;</Option>
                                    <Option value="<">&lt;</Option>
                                    <Option value=">=">&gt;=</Option>
                                    <Option value="<=">&lt;=</Option>
                                    <Option value="==">==</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="config_value"
                                label="Value"
                                rules={[{ required: true }]}
                            >
                                <Input type="number" />
                            </Form.Item>
                        </>
                    )}

                    {ruleType === "night_movement" && (
                        <>
                            <Form.Item
                                name="config_start_hour"
                                label="Night starts at"
                                rules={[{ required: true }]}
                                initialValue={dayjs().hour(22).minute(0)}
                            >
                                <TimePicker format="HH:mm" />
                            </Form.Item>
                            <Form.Item
                                name="config_end_hour"
                                label="Night ends at"
                                rules={[{ required: true }]}
                                initialValue={dayjs().hour(6).minute(0)}
                            >
                                <TimePicker format="HH:mm" />
                            </Form.Item>
                        </>
                    )}

                    {ruleType === "weekend_movement" && (
                        <p style={{ color: "rgba(255,255,255,0.65)" }}>
                            This rule triggers on any movement detected on Saturday or Sunday
                        </p>
                    )}
                </div>

                <div style={{ display: currentStep === 2 ? "block" : "none" }}>
                    {currentStep === 2 && (
                        <Card title="Summary">
                            <Descriptions column={1}>
                                <Descriptions.Item label="Rule">{formValues.name}</Descriptions.Item>
                                <Descriptions.Item label="Type">
                                    {getRuleTypeDetails(formValues.rule_type).label}
                                </Descriptions.Item>
                                <Descriptions.Item label="Device">
                                    {formValues.device_id === "all"
                                        ? "All devices"
                                        : devicesData.find((d: any) => d.id === formValues.device_id)?.name || formValues.device_id}
                                </Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    {initialValues ? (initialValues.is_active ? "Active" : "Inactive") : "Active (Default)"}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    )}
                </div>
            </Form>
        </Modal>
    );
};
