import { CampaignForm } from '@/components/CampaignForm';

export default function NewCampaignPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Campaign</h2>
        <p className="text-muted-foreground">Add a new campaign and track videos.</p>
      </div>
      <CampaignForm />
    </div>
  );
}
