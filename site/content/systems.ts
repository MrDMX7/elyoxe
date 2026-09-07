/* The systems map behind the hero: the infrastructure Elyoxe actually runs,
   not a generic particle field. Positions are normalised to the canvas
   (x from the reading-start side, y from the top) and mirrored for RTL. */
export type SystemNode = {
  id: string; label: string; x: number; y: number;
  kind: "anchor" | "infra"; live?: boolean; slug?: string; size?: number;
};

export const nodes: SystemNode[] = [
  // the four projects + this page
  { id: "invoiceready", label: "invoiceready.ae", x: 0.74, y: 0.4, kind: "anchor", live: true, slug: "invoiceready", size: 1.6 },
  { id: "ahlam", label: "ahlam.elyoxe.com", x: 0.86, y: 0.14, kind: "anchor", live: true, slug: "ahlam", size: 1.6 },
  { id: "elyoxe", label: "elyoxe.com", x: 0.62, y: 0.5, kind: "anchor", live: true, size: 1.3 },
  { id: "khutwa", label: "Khutwa · Android", x: 0.95, y: 0.36, kind: "anchor", slug: "khutwa", size: 1.5 },
  { id: "quant", label: "quant · EC2 Tokyo", x: 0.3, y: 0.46, kind: "anchor", slug: "quantitative-method", size: 1.5 },
  // the infrastructure they run on
  { id: "cloudfront", label: "CloudFront", x: 0.66, y: 0.2, kind: "infra", size: 1.1 },
  { id: "s3", label: "S3", x: 0.54, y: 0.34, kind: "infra", size: 1.1 },
  { id: "acm", label: "ACM", x: 0.76, y: 0.05, kind: "infra" },
  { id: "route53", label: "Route 53", x: 0.48, y: 0.1, kind: "infra" },
  { id: "lambda", label: "Lambda", x: 0.42, y: 0.38, kind: "infra" },
  { id: "ses", label: "SES", x: 0.34, y: 0.2, kind: "infra" },
  { id: "dynamodb", label: "DynamoDB", x: 0.46, y: 0.54, kind: "infra" },
  { id: "actions", label: "GitHub Actions", x: 0.24, y: 0.08, kind: "infra" },
  { id: "github", label: "GitHub", x: 0.16, y: 0.28, kind: "infra" },
  { id: "ec2", label: "EC2 · ap-northeast-1", x: 0.2, y: 0.58, kind: "infra" },
  { id: "android", label: "SensorManager", x: 0.88, y: 0.56, kind: "infra" },
];

export const edges: [string, string][] = [
  ["invoiceready", "cloudfront"], ["invoiceready", "s3"], ["invoiceready", "lambda"], ["invoiceready", "ses"], ["invoiceready", "dynamodb"],
  ["ahlam", "cloudfront"], ["ahlam", "s3"], ["ahlam", "route53"],
  ["elyoxe", "cloudfront"], ["elyoxe", "s3"], ["elyoxe", "actions"], ["elyoxe", "lambda"],
  ["cloudfront", "acm"], ["cloudfront", "s3"], ["cloudfront", "route53"], ["lambda", "ses"],
  ["khutwa", "android"], ["khutwa", "github"],
  ["quant", "ec2"], ["quant", "github"], ["github", "actions"], ["actions", "s3"],
];
