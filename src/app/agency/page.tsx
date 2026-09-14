import { AcquisitionWorkspace } from "@/components/acquisition-workspace";

export default function AgencyDemo() {
  return (
    <AcquisitionWorkspace
      brand={{
        name: "DistroNow Studio",
        description:
          "We turn one property shoot into a month of social content and a direct-booking campaign.",
        website: "https://example.com",
        audience: "Independent boutique hotels",
      }}
    />
  );
}
