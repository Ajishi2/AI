export default function TaskPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4">
      <h1>Task Details</h1>
      <p>Task ID: {params.id}</p>
    </div>
  );
} 