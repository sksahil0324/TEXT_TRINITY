import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, XCircle, InfoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const specialRequirementOptions = [
  { id: "copyright_friendly", label: "Copyright Friendly" },
  { id: "local_processing", label: "Local Processing (No API)" },
  { id: "contextual_understanding", label: "Contextual Understanding" },
  { id: "creative", label: "Creative Output" },
  { id: "extractive", label: "Extractive Processing" },
  { id: "abstractive", label: "Abstractive/Generative" },
  { id: "paraphrasing", label: "Paraphrasing Capability" }
];

export default function AlgorithmRecommendation() {
  const { toast } = useToast();
  const [result, setResult] = useState<any>(null);

  const form = useForm({
    defaultValues: {
      taskType: "summarization",
      textLength: 1500,
      contentDomain: "general",
      languageComplexity: "moderate",
      priorityFactor: "balanced",
      specialRequirements: []
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/recommend-algorithm", data);
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Algorithm recommendation ready",
        description: "We've found the best algorithm for your needs",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Recommendation failed",
        description: error.message || "Failed to get recommendation",
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: any) {
    mutate(values);
  }

  return (
    <div className="flex flex-col space-y-6 w-full max-w-4xl mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Algorithm Recommendation</h2>
        <p className="text-muted-foreground">
          Get personalized algorithm recommendations based on your specific text processing needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Requirements</CardTitle>
            <CardDescription>
              Tell us about your text processing task and priorities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="taskType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select task type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="summarization">Text Summarization</SelectItem>
                          <SelectItem value="translation">Language Translation</SelectItem>
                          <SelectItem value="content_generation">Content Generation</SelectItem>
                          <SelectItem value="keyword_extraction">Keyword Extraction</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        What type of NLP task are you performing?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="textLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text Length (characters)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={100}
                          max={100000}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Approximate length of text to process
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Domain</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., technical, medical, marketing, general"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Domain or topic area of your content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="languageComplexity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language Complexity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select complexity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="complex">Complex</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How complex is the language in your text?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priorityFactor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Factor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="speed">Speed</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        What's more important for your use case?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialRequirements"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Special Requirements</FormLabel>
                        <FormDescription>
                          Select any specific requirements for your task
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {specialRequirementOptions.map((option) => (
                          <FormField
                            key={option.id}
                            control={form.control}
                            name="specialRequirements"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={option.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-2"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), option.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value: string) => value !== option.id
                                              ) || []
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {option.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="mt-4 w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Recommendations...
                    </>
                  ) : (
                    "Get Algorithm Recommendation"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="flex flex-col space-y-6">
          {result ? (
            <>
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Recommended Algorithm</span>
                    <Badge 
                      variant={result.confidence > 0.8 ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {Math.round(result.confidence * 100)}% confidence
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Based on your specific requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-card p-4 rounded-md border mb-4">
                    <h3 className="text-xl font-bold text-primary mb-2">{result.recommendedAlgorithm}</h3>
                    <p className="text-sm text-muted-foreground">{result.explanation}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Suggested Parameters</h4>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <pre className="text-xs overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(result.suggestedParameters, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alternative Options</CardTitle>
                  <CardDescription>
                    Other algorithms you might consider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.alternativeAlgorithms.map((alt: any, i: number) => (
                      <div key={i} className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{alt.name}</h4>
                          <Badge variant="outline" className="ml-2">
                            {Math.round(alt.score * 100)}% match
                          </Badge>
                        </div>
                        
                        <Tabs defaultValue="strengths" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="strengths">Strengths</TabsTrigger>
                            <TabsTrigger value="weaknesses">Weaknesses</TabsTrigger>
                          </TabsList>
                          <TabsContent value="strengths" className="pt-2">
                            <ul className="text-sm space-y-1">
                              {alt.strengths.map((s: string, j: number) => (
                                <li key={j} className="flex items-start">
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </TabsContent>
                          <TabsContent value="weaknesses" className="pt-2">
                            <ul className="text-sm space-y-1">
                              {alt.weaknesses.map((w: string, j: number) => (
                                <li key={j} className="flex items-start">
                                  <XCircle className="h-4 w-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </TabsContent>
                        </Tabs>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <InfoIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Get Personalized Recommendations</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Fill out the form to receive algorithm recommendations tailored to your specific text processing needs and priorities.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}