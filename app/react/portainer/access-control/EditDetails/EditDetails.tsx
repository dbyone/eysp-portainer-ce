import { useCallback } from 'react';
import { FormikErrors } from 'formik';

import { useUser } from '@/portainer/hooks/useUser';
import { EnvironmentId } from '@/portainer/environments/types';

import { BoxSelector } from '@@/BoxSelector';
import { FormError } from '@@/form-components/FormError';

import { ResourceControlOwnership, AccessControlFormData } from '../types';

import { UsersField } from './UsersField';
import { TeamsField } from './TeamsField';
import { useLoadState } from './useLoadState';
import { useOptions } from './useOptions';

interface Props {
  values: AccessControlFormData;
  onChange(values: AccessControlFormData): void;
  isPublicVisible?: boolean;
  errors?: FormikErrors<AccessControlFormData>;
  formNamespace?: string;
  environmentId?: EnvironmentId;
}

export function EditDetails({
  values,
  onChange,
  isPublicVisible = false,
  errors,
  formNamespace,
  environmentId,
}: Props) {
  const { user, isAdmin } = useUser();

  const { users, teams, isLoading } = useLoadState(environmentId);
  const options = useOptions(isAdmin, teams, isPublicVisible);

  const handleChange = useCallback(
    (partialValues: Partial<typeof values>) => {
      onChange({ ...values, ...partialValues });
    },

    [values, onChange]
  );

  if (isLoading || !teams || !users) {
    return null;
  }

  return (
    <>
      <BoxSelector
        radioName={withNamespace('ownership')}
        value={values.ownership}
        options={options}
        onChange={(ownership) => handleChangeOwnership(ownership)}
      />

      {values.ownership === ResourceControlOwnership.RESTRICTED && (
        <div aria-label="extra-options">
          {isAdmin && (
            <UsersField
              name={withNamespace('authorizedUsers')}
              users={users}
              onChange={(authorizedUsers) => handleChange({ authorizedUsers })}
              value={values.authorizedUsers}
              errors={errors?.authorizedUsers}
            />
          )}

          {(isAdmin || teams.length > 1) && (
            <TeamsField
              name={withNamespace('authorizedTeams')}
              teams={teams}
              overrideTooltip={
                !isAdmin && teams.length > 1
                  ? '由于你是多个团队的成员，你可以选择哪些团队将能够管理该资源。'
                  : undefined
              }
              onChange={(authorizedTeams) => handleChange({ authorizedTeams })}
              value={values.authorizedTeams}
              errors={errors?.authorizedTeams}
            />
          )}

          {typeof errors === 'string' && (
            <div className="form-group col-md-12">
              <FormError>{errors}</FormError>
            </div>
          )}
        </div>
      )}
    </>
  );

  function withNamespace(name: string) {
    return formNamespace ? `${formNamespace}.${name}` : name;
  }

  function handleChangeOwnership(ownership: ResourceControlOwnership) {
    let { authorizedTeams, authorizedUsers } = values;

    if (ownership === ResourceControlOwnership.PRIVATE && user) {
      authorizedUsers = [user.Id];
      authorizedTeams = [];
    }

    if (ownership === ResourceControlOwnership.RESTRICTED) {
      authorizedUsers = [];
      authorizedTeams = [];
    }

    handleChange({ ownership, authorizedTeams, authorizedUsers });
  }
}
