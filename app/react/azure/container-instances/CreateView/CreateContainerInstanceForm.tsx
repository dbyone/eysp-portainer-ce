import { Field, Form, Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { ContainerInstanceFormValues } from '@/react/azure/types';
import * as notifications from '@/portainer/services/notifications';
import { useUser } from '@/portainer/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control/AccessControlForm';
import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';

import { FormControl } from '@@/form-components/FormControl';
import { Input, Select } from '@@/form-components/Input';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { LoadingButton } from '@@/buttons/LoadingButton';

import { validationSchema } from './CreateContainerInstanceForm.validation';
import { PortsMappingField } from './PortsMappingField';
import { useFormState, useLoadFormState } from './useLoadFormState';
import {
  getSubscriptionLocations,
  getSubscriptionResourceGroups,
} from './utils';
import { useCreateInstanceMutation } from './useCreateInstanceMutation';

export function CreateContainerInstanceForm() {
  const environmentId = useEnvironmentId();
  const { isAdmin } = useUser();

  const { providers, subscriptions, resourceGroups, isLoading } =
    useLoadFormState(environmentId);

  const { initialValues, subscriptionOptions } = useFormState(
    subscriptions,
    resourceGroups,
    providers
  );

  const router = useRouter();

  const { mutateAsync } = useCreateInstanceMutation(
    resourceGroups,
    environmentId
  );

  if (isLoading) {
    return null;
  }

  return (
    <Formik<ContainerInstanceFormValues>
      initialValues={initialValues}
      validationSchema={() => validationSchema(isAdmin)}
      onSubmit={onSubmit}
      validateOnMount
      validateOnChange
      enableReinitialize
    >
      {({
        errors,
        handleSubmit,
        isSubmitting,
        isValid,
        values,
        setFieldValue,
      }) => (
        <Form className="form-horizontal" onSubmit={handleSubmit} noValidate>
          <FormSectionTitle>Azure settings</FormSectionTitle>
          <FormControl
            label="订阅"
            inputId="subscription-input"
            errors={errors.subscription}
          >
            <Field
              name="subscription"
              as={Select}
              id="subscription-input"
              options={subscriptionOptions}
            />
          </FormControl>

          <FormControl
            label="资源组"
            inputId="resourceGroup-input"
            errors={errors.resourceGroup}
          >
            <Field
              name="resourceGroup"
              as={Select}
              id="resourceGroup-input"
              options={getSubscriptionResourceGroups(
                values.subscription,
                resourceGroups
              )}
            />
          </FormControl>

          <FormControl
            label="位置"
            inputId="location-input"
            errors={errors.location}
          >
            <Field
              name="location"
              as={Select}
              id="location-input"
              options={getSubscriptionLocations(values.subscription, providers)}
            />
          </FormControl>

          <FormSectionTitle>容器配置</FormSectionTitle>

          <FormControl label="名称" inputId="name-input" errors={errors.name}>
            <Field
              name="name"
              as={Input}
              id="name-input"
              placeholder="e.g. myContainer"
            />
          </FormControl>

          <FormControl
            label="镜像"
            inputId="image-input"
            errors={errors.image}
          >
            <Field
              name="image"
              as={Input}
              id="image-input"
              placeholder="e.g. nginx:alpine"
            />
          </FormControl>

          <FormControl label="OS" inputId="os-input" errors={errors.os}>
            <Field
              name="os"
              as={Select}
              id="os-input"
              options={[
                { label: 'Linux', value: 'Linux' },
                { label: 'Windows', value: 'Windows' },
              ]}
            />
          </FormControl>

          <PortsMappingField
            value={values.ports}
            onChange={(value) => setFieldValue('ports', value)}
            errors={errors.ports}
          />

          <div className="form-group">
            <div className="col-sm-12 small text-muted">
            这将自动部署一个具有公共IP地址的容器
            </div>
          </div>

          <FormSectionTitle>容器资源</FormSectionTitle>

          <FormControl label="CPU" inputId="cpu-input" errors={errors.cpu}>
            <Field
              name="cpu"
              as={Input}
              id="cpu-input"
              type="number"
              placeholder="1"
            />
          </FormControl>

          <FormControl
            label="内存"
            inputId="cpu-input"
            errors={errors.memory}
          >
            <Field
              name="memory"
              as={Input}
              id="memory-input"
              type="number"
              placeholder="1"
            />
          </FormControl>

          <AccessControlForm
            formNamespace="accessControl"
            onChange={(values) => setFieldValue('accessControl', values)}
            values={values.accessControl}
            errors={errors.accessControl}
          />

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                disabled={!isValid}
                isLoading={isSubmitting}
                loadingText="部署正在进行中..."
              >
                <i className="fa fa-plus space-right" aria-hidden="true" />
                部署容器
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );

  async function onSubmit(values: ContainerInstanceFormValues) {
    try {
      await mutateAsync(values);
      notifications.success('容器成功创建', values.name);
      router.stateService.go('azure.containerinstances');
    } catch (e) {
      notifications.error('Failure', e as Error, '无法创建容器');
    }
  }
}
