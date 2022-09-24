import { useEffect, useState, useMemo } from 'react';
import { getLine } from '@src/core/frameworks/gql';
import { Address, BaseCreditLine, GetLinesArgs } from '@types';
import { LinesActions } from "@store/modules/lines/lines.actions";
import { useAppDispatch } from "@hooks/store";

export function useLine(id: Address): [BaseCreditLine | undefined, Boolean] {
  const [line, setLine] = useState<BaseCreditLine | undefined>();
  const [loading, isLoading] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(LinesActions.getLCreditLineById(id));
  }, [id]);

  return [line, loading];
}
