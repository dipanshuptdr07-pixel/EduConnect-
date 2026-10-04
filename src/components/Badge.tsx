export function Badge({children,tone='blue'}:{children:React.ReactNode;tone?:'blue'|'green'|'orange'|'red'|'gray'}){return <span className={`badge ${tone}`}>{children}</span>}
