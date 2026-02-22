import React from 'react';
import './responsivetable.css';

// Define the props interface
interface ResponsiveTableProps {
  headers: string[];
  data: (string | number)[][];
  className?: string;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ 
  headers, 
  data,
  className = '' 
}) => {
  return (
    <div className={`responsive-table-container ${className}`}>
      <div className="responsive-table">
        <div className="responsive-table-head">
          <div className="responsive-table-row">
            {headers.map((header, index) => (
              <div key={index} className="responsive-table-header">
                {header}
              </div>
            ))}
          </div>
        </div>
        <div className="responsive-table-body">
          {data.map((row, rowIndex) => (
            <div key={rowIndex} className="responsive-table-row">
              {headers.map((header, cellIndex) => (
                <div 
                  key={cellIndex} 
                  className="responsive-table-cell" 
                  data-label={header}
                >
                  {row[cellIndex]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTable;