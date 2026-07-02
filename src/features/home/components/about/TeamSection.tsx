"use client";

import Image from "next/image";
import { Github, Twitter, Instagram, Facebook, Linkedin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { team } from "./about-data";
import { RevealSection } from "./RevealSection";

export function TeamSection() {
  return (
    <section className="border-t border-white/5 bg-zinc-900/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <RevealSection className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-pink-500/30 text-pink-400 bg-pink-500/10">The Team</Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">The people building it</h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto text-lg">A small, focused team with a big goal — making code review fast, thorough, and painless for every developer on the planet.</p>
        </RevealSection>

        <div className={`grid gap-5 justify-center ${team.length === 1 ? "max-w-sm mx-auto" : team.length === 2 ? "sm:grid-cols-2 max-w-2xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {team.map((member, i) => (
            <RevealSection key={member.name} delay={i * 0.1}>
              <div className="group rounded-2xl border border-white/5 bg-white/2 p-8 text-center transition-all duration-300 hover:bg-white/4 hover:border-white/10 hover:shadow-xl hover:shadow-indigo-500/10">
                <div className="mx-auto h-20 w-20 rounded-2xl overflow-hidden ring-2 ring-white/10 mb-5 shadow-lg">
                  <Image src={member.githubPhoto} alt={member.name} width={80} height={80} className="object-cover w-full h-full" />
                </div>
                <h3 className="text-lg font-bold text-white">{member.name}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-indigo-400 font-medium truncate">{member.role}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{member.description}</p>
                </div>
                <div className="flex items-center justify-center gap-3 mt-5">
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors" aria-label={`${member.name} GitHub profile`}><Github className="h-4 w-4" /></a>
                  {member.twitter && <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-sky-400 transition-colors" aria-label={`${member.name} Twitter profile`}><Twitter className="h-4 w-4" /></a>}
                  {member.instagram && <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-pink-400 transition-colors" aria-label={`${member.name} Instagram profile`}><Instagram className="h-4 w-4" /></a>}
                  {member.facebook && <a href={member.facebook} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-blue-400 transition-colors" aria-label={`${member.name} Facebook profile`}><Facebook className="h-4 w-4" /></a>}
                  {member.linkedin && <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-blue-500 transition-colors" aria-label={`${member.name} LinkedIn profile`}><Linkedin className="h-4 w-4" /></a>}
                </div>
              </div>
            </RevealSection>
          ))}
        </div>

        <RevealSection delay={0.2} className="mt-12">
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-white/1">
            <p className="text-zinc-400 text-sm uppercase tracking-widest font-medium mb-2">We&apos;re growing</p>
            <h3 className="text-xl font-bold text-white mb-3">Want to shape the future of code review?</h3>
            <p className="text-zinc-400 max-w-md mx-auto mb-6">We are always looking for passionate engineers, designers, and developer advocates. Reach out — let&apos;s build something great together.</p>
            <Button asChild variant="outline" className="rounded-full border-white/15 hover:bg-white/5 text-white">
              <a href="mailto:codecatch27@gmail.com">Say hello <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
