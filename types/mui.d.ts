import type { StepIconProps } from '@mui/material/StepIcon';

declare module '@mui/material/StepLabel' {
  interface StepLabelStepIconSlotPropsOverrides {
    unlocked?: boolean;
  }
}

// Ensure the custom prop stays part of the slot's component props.
export type NumberedStepIconProps = StepIconProps & { unlocked?: boolean };
