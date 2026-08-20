'use client';

import * as React from 'react';
import { ArrowUpRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel';

interface BlogPostAuthor {
  name: string;
  role: string;
}

interface BlogPost {
  date: string;
  title: string;
  author: BlogPostAuthor;
  href?: string;
}

interface BlogSectionHeader {
  badge?: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaHref: string;
}

interface Blog1Props {
  header: BlogSectionHeader;
  posts: BlogPost[];
  className?: string;
  /** Optional render override for the CTA link */
  renderCtaLink?: (props: { href: string; children: React.ReactNode }) => React.ReactNode;
  /** Optional render override for individual card links */
  renderCardLink?: (props: { href: string; children: React.ReactNode }) => React.ReactNode;
}

export default function Blog1({
  header,
  posts,
  className,
  renderCtaLink,
  renderCardLink,
}: Blog1Props) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    });
  }, [api]);

  const ctaContent = (
    <span className="group/cta inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary hover:underline group-hover/cta:underline underline-offset-4">
      {header.ctaText}
      <ArrowUpRight className="size-4 transition-transform group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
    </span>
  );

  const renderCard = (post: BlogPost, index: number) => {
    const card = (
      <div
        className={cn(
          'group bg-[#f8fafc] relative flex flex-col justify-between rounded-none p-6 border border-border duration-300 w-full h-full',
          'min-h-[220px] sm:min-h-[240px]',
        )}
      >
        <span className="text-muted-foreground/70 text-sm font-medium">
          {post.date}
        </span>

        <h3 className="text-foreground mt-6 text-base leading-snug font-medium sm:text-lg text-left">
          {post.title}
        </h3>

        <div className="mt-auto flex items-end justify-between pt-8">
          <div className="leading-tight text-left">
            <p className="text-primary text-md font-medium">
              {post.author.name}
            </p>
            <p className="text-muted-foreground text-sm">
              {post.author.role}
            </p>
          </div>

          <div className="border-border bg-background text-muted-foreground group-hover:border-foreground/20 group-hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-none border transition-colors">
            <ArrowUpRight className="size-3.5" />
          </div>
        </div>
      </div>
    );

    if (renderCardLink && post.href) {
      return renderCardLink({
        href: post.href,
        children: card,
      });
    }

    if (post.href) {
      return (
        <a href={post.href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl w-full h-full flex">
          {card}
        </a>
      );
    }

    return card;
  };

  return (
    <section
      className={cn(
        'w-full bg-transparent px-4 pt-20 pb-[108px] sm:px-6 sm:pt-24 sm:pb-[140px] md:pt-28 md:pb-[172px] lg:pt-32 lg:pb-[204px]',
        className,
      )}
    >
      <div className="mx-auto max-w-[1300px]">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.2rem] xl:text-[2.4rem] 2xl:text-[2.5rem] font-bold leading-tight tracking-tight text-foreground [text-wrap:balance]">
              {header.heading}
            </h2>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end md:pt-8">
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem] md:text-right">
              {header.description}
            </p>

            {renderCtaLink ? (
              renderCtaLink({ href: header.ctaHref, children: ctaContent })
            ) : (
              <a href={header.ctaHref}>{ctaContent}</a>
            )}
          </div>
        </div>

        {/* Desktop grid layout */}
        <div className="hidden lg:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <div key={index} className="flex w-full">
              {renderCard(post, index)}
            </div>
          ))}
        </div>

        {/* Mobile/Tablet Carousel layout */}
        <div className="lg:hidden w-full relative">
          <Carousel setApi={setApi} opts={{ align: 'start', loop: false }} className="w-full">
            <CarouselContent className="-ml-4">
              {posts.map((post, index) => (
                <CarouselItem key={index} className="pl-4 basis-[88%] sm:basis-[80%] md:basis-[48%] flex">
                  <div className="w-full flex">
                    {renderCard(post, index)}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Carousel controls */}
          <div className="flex items-center justify-between mt-6 px-1">
            {/* Dots */}
            <div className="flex gap-2">
              {posts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={current === i ? 'true' : 'false'}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    current === i 
                      ? 'w-6 bg-[#195adc]' 
                      : 'w-2.5 bg-[#e4e4e7] hover:bg-[#d4d4d8]'
                  }`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => api?.scrollPrev()}
                disabled={!canScrollPrev}
                className="w-9 h-9 rounded-full border-border text-foreground hover:bg-muted disabled:opacity-40 flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => api?.scrollNext()}
                disabled={!canScrollNext}
                className="w-9 h-9 rounded-full border-border text-foreground hover:bg-muted disabled:opacity-40 flex items-center justify-center cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

