const Card = ({ title, children, rightAction }) => (
  <div className="card">
    <div className="card-header">
      <h2>{title}</h2>
      {rightAction}
    </div>
    {children}
  </div>
);

export default Card;
