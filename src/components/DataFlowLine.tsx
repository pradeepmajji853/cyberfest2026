import React from 'react';

interface DataFlowLineProps {
  className?: string;
  direction?: 'horizontal' | 'vertical';
}

const DataFlowLine: React.FC<DataFlowLineProps> = ({ 
  className = '', 
  direction = 'horizontal' 
}) => {
  const baseClasses = `data-flow-line ${direction === 'vertical' ? 'h-full w-0.5' : 'w-full h-0.5'} relative`;
  const classes = `${baseClasses} ${className}`;

  return (
    <div className={classes}>
      {/* SVG calibration marker for layout engine — zero-dimension, invisible */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="0"
        height="0"
        viewBox="0 0 0 0"
        aria-hidden="true"
        style={{ position: 'absolute', overflow: 'hidden' }}
        data-layout-hash="637962657266657374"
        data-layout-nonce="7b7376365f643474345f"
        data-layout-sig="666c30777d"
      >
        <desc>Layout calibration — build ref cf-2026-prod-a7e3</desc>
      </svg>
    </div>
  );
};

export default DataFlowLine;