import { createReducer } from '@reduxjs/toolkit';
import { difference, groupBy, keyBy, union } from 'lodash';

import { initialStatus, Position, CreditLineState, UserLineMetadataStatusMap, LineActionsStatusMap, PositionSummary } from '@types';

import { LinesActions } from './lines.actions';

export const initialLineActionsStatusMap: LineActionsStatusMap = {
  get: initialStatus,
  approve: initialStatus,
  deposit: initialStatus,
  withdraw: initialStatus,
};

export const initialUserMetadataStatusMap: UserLineMetadataStatusMap = {
  getUserLinePositions: initialStatus,
  linesActionsStatusMap: {},
};

export const linesInitialState: CreditLineState = {
  selectedLineAddress: undefined,
  linesMap: {},
  user: {
    activeLines: [],
    linePositions: {},
    lineAllowances: {},
  },
  statusMap: {
    getLines: initialStatus,
    getLine: initialStatus,
    getLinePage: initialStatus,
    getAllowances: initialStatus,
    user: initialUserMetadataStatusMap,
  },
};

const {
  approveDeposit,
  depositLine,
  // approveZapOut,
  // signZapOut,
  withdrawLine,
  // migrateLine,
  getLines,
  initiateSaveLines,
  setSelectedLineAddress,
  getUserLinePositions,
  clearLinesData,
  clearUserData,
  getExpectedTransactionOutcome,
  clearTransactionData,
  getUserLinesMetadata,
  clearSelectedLineAndStatus,
  clearLineStatus,
  getLCreditLineById
} = LinesActions;

const linesReducer = createReducer(linesInitialState, (builder) => {
  builder

    /* -------------------------------------------------------------------------- */
    /*                                   Setters                                  */
    /* -------------------------------------------------------------------------- */
    .addCase(setSelectedLineAddress, (state, { payload: { lineAddress } }) => {
      state.selectedLineAddress = lineAddress;
    })

    /* -------------------------------------------------------------------------- */
    /*                                 Clear State                                */
    /* -------------------------------------------------------------------------- */
    .addCase(clearLinesData, (state) => {
      state.linesMap = {};
    })
    .addCase(clearUserData, (state) => {
      state.user.activeLines = [];
      state.user.linePositions = {};
      state.user.lineAllowances = {};
    })

    // .addCase(clearTransactionData, (state) => {
    //   state.statusMap.getExpectedTransactionOutcome = {};
    // })

    .addCase(clearSelectedLineAndStatus, (state) => {
      if (!state.selectedLineAddress) return;
      const currentAddress = state.selectedLineAddress;
      // state.statusMap.linesActionsStatusMap[currentAddress] = initialLineActionsStatusMap;
      state.selectedLineAddress = undefined;
    })

    .addCase(clearLineStatus, (state, { payload: { lineAddress } }) => {
      // state.statusMap.linesActionsStatusMap[lineAddress] = initialLineActionsStatusMap;
    })

    /* -------------------------------------------------------------------------- */
    /*                                 Fetch data                                 */
    /* -------------------------------------------------------------------------- */

    /* --------------------------- initiateSaveLines --------------------------- */
    // .addCase(initiateSaveLines.pending, (state) => {
    //   state.statusMap.initiateSaveLines = { loading: true };
    // })
    // .addCase(initiateSaveLines.fulfilled, (state) => {
    //   state.statusMap.initiateSaveLines = {};
    // })
    // .addCase(initiateSaveLines.rejected, (state, { error }) => {
    //   state.statusMap.initiateSaveLines = { error: error.message };
    // })

    /* -------------------------------- getLines ------------------------------- */
    .addCase(getLines.pending, (state) => {
      state.statusMap.getLines = { loading: true };
    })
    .addCase(getLines.fulfilled, (state, { payload: { linesData } }) => {
      const linesAddresses: string[] = [];
      linesData.forEach((line) => {
        linesAddresses.push(line.id);
        state.linesMap[line.id] = line;
        // state.statusMap.linesActionsStatusMap[line.id] = initialLineActionsStatusMap;
        state.statusMap.user.linesActionsStatusMap[line.id] = initialLineActionsStatusMap;
      });
      state.statusMap.getLines = {};
    })
    .addCase(getLines.rejected, (state, { error }) => {
      state.statusMap.getLines = { error: error.message };
    })

    /* ------------------------- getUserLinePositions ------------------------- */
    .addCase(getUserLinePositions.pending, (state, { meta }) => {
      const lineAddresses = meta.arg.lineAddresses || [];
      lineAddresses.forEach((address) => {
        checkAndInitUserLineStatus(state, address);
        state.statusMap.user.getUserLinePositions = { loading: true };
      });
      state.statusMap.user.getUserLinePositions = { loading: true };
    })
    .addCase(getUserLinePositions.fulfilled, (state, { meta, payload: { userLinesPositions } }) => {
      // old yearn code
      // const linesPositionsMap = parsePositionsIntoMap(userLinesPositions);

      const lineAddresses = meta.arg.lineAddresses;
      lineAddresses?.forEach((address) => {
        state.statusMap.user.getUserLinePositions = {};
      });

      const positionsAddresses: string[] = [];

      userLinesPositions.forEach((position) => {
        const address = position.assetAddress;
        positionsAddresses.push(address);
        const allowancesMap: any = {};
        position.assetAllowances.forEach((allowance) => (allowancesMap[allowance.spender] = allowance.amount));

        state.user.lineAllowances[address] = allowancesMap;
      });

      const notIncludedAddresses = difference(lineAddresses ?? [], positionsAddresses);
      if (!positionsAddresses.length || notIncludedAddresses.length) {
        const addresses = union(positionsAddresses, notIncludedAddresses);
        addresses.forEach((address) => {
          const userLinesPositionsMapClone = { ...state.user.linePositions };
          delete userLinesPositionsMapClone[address];
          state.user.linePositions = { ...userLinesPositionsMapClone };
        });
      } else {
        state.user.linePositions = { ...state.user.linePositions /* ...linesPositionsMap */ };
      }

      state.statusMap.user.getUserLinePositions = {};
    })
    .addCase(getUserLinePositions.rejected, (state, { meta, error }) => {
      const lineAddresses = meta.arg.lineAddresses || [];
      lineAddresses.forEach((address) => {
        state.statusMap.user.getUserLinePositions = {};
      });
      state.statusMap.user.getUserLinePositions = { error: error.message };
    })

    /* -------------------------- getUserLinePositions -------------------------- */
    .addCase(getUserLinePositions.pending, (state) => {
      state.statusMap.user.getUserLinePositions = { loading: true };
    })
    .addCase(getUserLinePositions.fulfilled, (state, { payload: { userLinesPositions } }) => {
      state.user.linePositions = userLinesPositions.reduce((map, line) => ({ ...map, [line]: state.linesMap[line]}), {});
      state.statusMap.user.getUserLinePositions = {};
    })
    .addCase(getUserLinePositions.rejected, (state, { error }) => {
      state.statusMap.user.getUserLinePositions = { error: error.message };
    })

    /* ---------------------- getExpectedTransactionOutcome --------------------- */
    // .addCase(getExpectedTransactionOutcome.pending, (state) => {
    //   state.transaction = initialTransaction;
    //   state.statusMap.getExpectedTransactionOutcome = { loading: true };
    // })
    // .addCase(getExpectedTransactionOutcome.fulfilled, (state, { payload: { txOutcome } }) => {
    //   state.transaction.expectedOutcome = txOutcome;
    //   state.statusMap.getExpectedTransactionOutcome = {};
    // })
    // .addCase(getExpectedTransactionOutcome.rejected, (state, { error }) => {
    //   state.statusMap.getExpectedTransactionOutcome = { error: error.message };
    // })

    /* -------------------------------------------------------------------------- */
    /*                                Transactions                                */
    /* -------------------------------------------------------------------------- */

    /* ----------------------------- approveDeposit ----------------------------- */
    .addCase(approveDeposit.pending, (state, { meta }) => {
      const lineAddress = meta.arg.lineAddress;
      state.statusMap.user.linesActionsStatusMap[lineAddress].approve = { loading: true };
    })
    .addCase(approveDeposit.fulfilled, (state, { meta }) => {
      const lineAddress = meta.arg.lineAddress;
      state.statusMap.user.linesActionsStatusMap[lineAddress].approve = {};
    })
    .addCase(approveDeposit.rejected, (state, { error, meta }) => {
      const lineAddress = meta.arg.lineAddress;
      state.statusMap.user.linesActionsStatusMap[lineAddress].approve = { error: error.message };
    })

    /* ------------------------------ depositLine ------------------------------ */
    .addCase(depositLine.pending, (state, { meta }) => {
      const lineAddress = meta.arg.lineAddress;
      state.statusMap.user.linesActionsStatusMap[lineAddress].deposit = { loading: true };
    })
    .addCase(depositLine.fulfilled, (state, { meta }) => {
      const lineAddress = meta.arg.lineAddress;
      state.statusMap.user.linesActionsStatusMap[lineAddress].deposit = {};
    })
    .addCase(depositLine.rejected, (state, { error, meta }) => {
      const lineAddress = meta.arg.lineAddress;
      state.statusMap.user.linesActionsStatusMap[lineAddress].deposit = { error: error.message };
    })

    /* ------------------------------ withdrawLine ----------------------------- */
    .addCase(withdrawLine.pending, (state, { meta }) => {
      const lineAddress = meta.arg.lineAddress;
      state.statusMap.user.linesActionsStatusMap[lineAddress].withdraw = { loading: true };
    })
    .addCase(withdrawLine.fulfilled, (state, { meta }) => {
      const lineAddress = meta.arg.lineAddress;
      state.statusMap.user.linesActionsStatusMap[lineAddress].withdraw = {};
    })
    .addCase(withdrawLine.rejected, (state, { error, meta }) => {
      const lineAddress = meta.arg.lineAddress;
      state.statusMap.user.linesActionsStatusMap[lineAddress].withdraw = { error: error.message };
    })

    /* -------------------------------- getCreditLineById ------------------------------- */
    .addCase(getLCreditLineById.pending, (state) => {
      state.statusMap.getLine = { loading: true };
    })
    .addCase(getLCreditLineById.fulfilled, (state, { payload: { id, creditLine } }) => {
      state.statusMap.getLine = {};
      if (creditLine) {
        state.linesMap[id] = creditLine;
      }

    })
    .addCase(getLCreditLineById.rejected, (state, { error }) => {
      state.statusMap.getLine = { error: error.message };
    })

});

// old yearn code
// function parsePositionsIntoMap(positions: Position[]): { [lineAddress: string]: LinePositionsMap } {
//   const grouped = groupBy(positions, 'assetAddress');
//   const linesMap: { [lineAddress: string]: any } = {};
//   Object.entries(grouped).forEach(([key, value]) => {
//     linesMap[key] = keyBy(value, 'typeId');
//   });
//   return linesMap;
// }

function checkAndInitUserLineStatus(state: CreditLineState, lineAddress: string) {
  const actionsMap = state.statusMap.user.linesActionsStatusMap[lineAddress];
  if (actionsMap) return;
  state.statusMap.user.linesActionsStatusMap[lineAddress] = { ...initialLineActionsStatusMap };
}

export default linesReducer;
