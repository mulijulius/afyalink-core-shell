import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Phone, MapPin, IdCard, Droplet, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPatient, initials } from "@/data/patients";

export const Route = createFileRoute("/patients/$patientId")({
  head: ({ params }) => ({
    meta: [{ title: `Patient ${params.patientId} · AfyaLink HMS` }],
  }),
  loader: ({ params }) => {
    const patient = getPatient(params.patientId);
    if (!patient) throw notFound();
    return { patient };
  },
  component: PatientProfile,
  notFoundComponent: () => (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Patient not found</h2>
      <Button asChild variant="outline">
        <Link to="/patients">Back to patients</Link>
      </Button>
    </div>
  ),
});

function PatientProfile() {
  const { patient } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/patients">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Patients
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
              {initials(patient.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {patient.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {patient.age} yrs · {patient.gender}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <IdCard className="h-4 w-4" />
                <span className="font-mono">{patient.nationalId}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Droplet className="h-4 w-4" />
                Blood Group{" "}
                <Badge variant="outline" className="ml-1 border-primary/30 bg-primary/5 text-primary">
                  {patient.bloodGroup}
                </Badge>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {patient.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {patient.subCounty}, {patient.county}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                NoK: {patient.nextOfKin.name} ({patient.nextOfKin.phone})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Allergies:
              </span>
              {patient.allergies.length === 0 ? (
                <Badge variant="outline" className="font-normal">None recorded</Badge>
              ) : (
                patient.allergies.map((a) => (
                  <Badge
                    key={a}
                    variant="outline"
                    className="border-destructive/30 bg-destructive/10 font-medium text-destructive"
                  >
                    {a}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="visits">
        <TabsList>
          <TabsTrigger value="visits">Visit History</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="labs">Lab Results</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="mt-4">
          <Card>
            <CardContent className="p-5">
              {patient.visits.length === 0 ? (
                <EmptyState text="No previous visits" />
              ) : (
                <ol className="relative space-y-6 border-l border-border pl-6">
                  {patient.visits.map((v, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[31px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-primary bg-background" />
                      <p className="text-xs font-medium text-muted-foreground">
                        {v.date}
                      </p>
                      <p className="mt-0.5 font-medium">{v.diagnosis}</p>
                      <p className="text-sm text-muted-foreground">
                        Attended by {v.clinician}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {patient.prescriptions.length === 0 ? (
                <div className="p-5"><EmptyState text="No prescriptions" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Drug</TableHead>
                      <TableHead>Dose</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.prescriptions.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{p.date}</TableCell>
                        <TableCell className="font-medium">{p.drug}</TableCell>
                        <TableCell>{p.dose}</TableCell>
                        <TableCell>{p.duration}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labs" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {patient.labs.length === 0 ? (
                <div className="p-5"><EmptyState text="No lab results" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.labs.map((l, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{l.date}</TableCell>
                        <TableCell className="font-medium">{l.test}</TableCell>
                        <TableCell>{l.result}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              l.status === "Abnormal"
                                ? "border-destructive/30 bg-destructive/10 text-destructive"
                                : "border-accent/30 bg-accent/10 text-accent"
                            }
                          >
                            {l.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {patient.billing.length === 0 ? (
                <div className="p-5"><EmptyState text="No billing records" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Amount (KSh)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.billing.map((b, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{b.date}</TableCell>
                        <TableCell className="font-medium">{b.item}</TableCell>
                        <TableCell className="text-right font-mono">
                          {b.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              b.status === "Paid"
                                ? "border-accent/30 bg-accent/10 text-accent"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                            }
                          >
                            {b.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>
  );
}
