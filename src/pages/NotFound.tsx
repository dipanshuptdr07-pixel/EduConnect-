import { Link } from 'react-router-dom';

export default function NotFound(){
  return (
    <div className="empty full-empty">
      <b>Page not found</b>
      <span>The requested EduConnect page does not exist.</span>
      <Link className="primary" to="/">Back to dashboard</Link>
    </div>
  );
}
