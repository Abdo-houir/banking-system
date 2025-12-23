import { Dispatch, SetStateAction, useCallback, useState } from 'react';

export interface UseBooleanProps {
  initialState?: boolean;
}

export interface UseBooleanReturn {
  value: boolean;
  onTrue: () => void;
  onFalse: () => void;
  onToggle: () => void;
  setValue: Dispatch<SetStateAction<boolean>>;
}

const useBoolean = ({ initialState = false }: UseBooleanProps = {}): UseBooleanReturn => {
  const [value, setValue] = useState<boolean>(initialState);

  const onTrue = useCallback(() => setValue(true), []);
  const onFalse = useCallback(() => setValue(false), []);
  const onToggle = useCallback(() => setValue((prev) => !prev), []);

  return {
    value,
    onTrue,
    onFalse,
    onToggle,
    setValue,
  };
};

export default useBoolean;
