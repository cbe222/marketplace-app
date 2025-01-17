import { keyBy } from 'lodash';

import { useAppSelector } from '@hooks';
import { selectDepositTokenOptionsByAsset } from '@store';
import { GeneralLabView, GeneralVaultView, TokenView } from '@types';

interface SelectedSellTokenProps {
  selectedSellTokenAddress?: string;
  selectedVaultOrLab?: GeneralVaultView | GeneralLabView; // TODO: types
  allowTokenSelect?: boolean;
}

interface SelectedSellToken {
  selectedSellToken?: TokenView;
  sourceAssetOptions: TokenView[];
}

export const useSelectedSellToken = ({
  selectedSellTokenAddress,
  selectedVaultOrLab,
  allowTokenSelect,
}: SelectedSellTokenProps): SelectedSellToken => {
  const depositTokenOptionsByAsset = useAppSelector(selectDepositTokenOptionsByAsset) as Function;
  const sellTokensOptions = depositTokenOptionsByAsset(selectedVaultOrLab?.address);
  console.log('sell token options', sellTokensOptions);
  const sellTokensOptionsMap = keyBy(sellTokensOptions, 'address');
  let selectedSellToken: TokenView | undefined = selectedSellTokenAddress
    ? sellTokensOptionsMap[selectedSellTokenAddress]
    : undefined;

  const sourceAssetOptions = selectedSellToken && allowTokenSelect === false ? [selectedSellToken] : sellTokensOptions;
  console.log('sell token options', selectedSellToken, sourceAssetOptions);
  return { selectedSellToken, sourceAssetOptions };
};
