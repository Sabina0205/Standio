export const headerFields = [
 ['companyName','Názov firmy','Company name'],
 ['product','Číslo produktu','Product number'],
 ['drawingNumber','Číslo výkresu','Drawing number'],
 ['date','Dátum revízie','Revision date'],
 ['revision','Revízia','Revision'],
 ['author','Vypracoval','Prepared by'],
 ['productName','Meno produktu','Product name'],
 ['productType','Typ','Type'],
 ['model','Model','Model'],
 ['process','Proces','Process'],
 ['processNumber','Číslo procesu','Process number'],
 ['processOwner','Vlastníci procesu','Process owner'],
 ['issueDate','Dátum vydania','Date of issue'],
 ['approvedBy','Schválil','Approved by'],
 ['documentNumber','DOKUMENT no.','Document number'],
] as const;
export type HeaderKey = typeof headerFields[number][0];
export const additionalHeaderKeys = ['companyName','drawingNumber','productName','productType','model','processNumber','processOwner','issueDate','approvedBy','documentNumber'] as const;
export const cycleFields=[['ct','CT'],['ctHandling','CT handling'],['finalCt','Final CT']] as const;
export const standardFields=[['standardLabel','Označenie štandardu'],['material','Materiál / Material'],['mold','Forma / Mold']] as const;
export const defaultStandardLabel='PART STANDARD\n(A)';
