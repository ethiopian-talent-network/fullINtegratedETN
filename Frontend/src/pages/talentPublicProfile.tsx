import { useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "../components/ui/button";
import {
  ArrowLeft,
  Star,
  MapPin,
  Briefcase,
  MessageSquare,
  UserPlus,
  Award,
  GraduationCap,
  ExternalLink,
  ThumbsUp,
  Calendar,
  DollarSign,
  CheckCircle,
} from "lucide-react";

export default function FreelancerPublicProfile() {
  const { id } = useParams();
  const [isConnected, setIsConnected] = useState(false);
  const [endorsedSkills, setEndorsedSkills] = useState<string[]>([]);

  const freelancer = {
    name: "Yohannes Tadesse",
    title: "Senior Full Stack Developer",
    location: "Addis Ababa, Ethiopia",
    hourlyRate: "45",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    rating: 4.9,
    totalReviews: 127,
    jobsCompleted: 89,
    memberSince: "2021",
    bio: "Passionate full-stack developer with 7+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies. I've helped numerous startups and enterprises build their digital products from scratch.",
    skills: [
      { name: "React", endorsements: 45 },
      { name: "Node.js", endorsements: 38 },
      { name: "TypeScript", endorsements: 42 },
      { name: "MongoDB", endorsements: 31 },
      { name: "AWS", endorsements: 28 },
      { name: "Docker", endorsements: 25 },
      { name: "REST APIs", endorsements: 40 },
      { name: "GraphQL", endorsements: 22 },
    ],
    languages: [
      { name: "English", level: "Fluent" },
      { name: "Amharic", level: "Native" },
    ],
    education: [
      {
        degree: "BSc in Computer Science",
        school: "Addis Ababa University",
        year: "2015 - 2019",
      },
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon",
        year: "2022",
      },
      {
        name: "React Advanced Patterns",
        issuer: "Frontend Masters",
        year: "2023",
      },
    ],
    portfolio: [
      {
        id: 1,
        title: "E-commerce Platform",
        description: "Full-featured online store with payment integration",
        image:
          "https://images.unsplash.com/photo-1557821552-17105176677c?w=400",
        url: "https://example.com",
      },
      {
        id: 2,
        title: "SaaS Dashboard",
        description: "Analytics dashboard for enterprise clients",
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
        url: "https://example.com",
      },
      {
        id: 3,
        title: "Mobile Banking App",
        description: "Secure banking application for iOS and Android",
        image:
          "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400",
        url: "https://example.com",
      },
    ],
    reviews: [
      {
        id: 1,
        client: "Sarah Johnson",
        rating: 5,
        date: "2 weeks ago",
        comment:
          "Yohannes is an exceptional developer. He delivered our project ahead of schedule and the quality exceeded our expectations. Highly recommended!",
        project: "E-commerce Website",
      },
      {
        id: 2,
        client: "Michael Chen",
        rating: 5,
        date: "1 month ago",
        comment:
          "Great communication and technical skills. Very professional and responsive to feedback. Will definitely hire again.",
        project: "SaaS Dashboard",
      },
      {
        id: 3,
        client: "Emma Williams",
        rating: 4,
        date: "2 months ago",
        comment:
          "Solid work on our mobile app. Very knowledgeable about React Native and delivered a polished product.",
        project: "Mobile Application",
      },
    ],
    connections: 156,
  };

  const toggleEndorsement = (skillName: string) => {
    if (endorsedSkills.includes(skillName)) {
      setEndorsedSkills(endorsedSkills.filter((s) => s !== skillName));
    } else {
      setEndorsedSkills([...endorsedSkills, skillName]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/freelancer-dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <Link to="/" className="text-2xl font-bold text-[#0084ca]">
              ETN
            </Link>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-6 mb-6">
            <img
              src={freelancer.avatar}
              alt={freelancer.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
            />

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {freelancer.name}
                  </h1>
                  <p className="text-xl text-gray-700 mb-3">
                    {freelancer.title}
                  </p>
                  <div className="flex items-center gap-6 text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span>{freelancer.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{freelancer.rating}</span>
                      <span>({freelancer.totalReviews} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#0084ca] mb-2">
                    ${freelancer.hourlyRate}/hr
                  </div>
                  <div className="flex gap-2">
                    <Link to="/messages">
                      <Button className="bg-[#0084ca] hover:bg-[#006ba6] text-white">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => setIsConnected(!isConnected)}
                      className={
                        isConnected ? "border-[#0084ca] text-[#0084ca]" : ""
                      }
                    >
                      {isConnected ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Connected
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Briefcase className="w-5 h-5" />
                    <span className="text-sm">Jobs Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {freelancer.jobsCompleted}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">Member Since</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {freelancer.memberSince}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <UserPlus className="w-5 h-5" />
                    <span className="text-sm">Connections</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {freelancer.connections}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-700 leading-relaxed">{freelancer.bio}</p>
          </div>
        </div>

        {/* Skills with Endorsements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Skills & Endorsements
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Click on a skill to endorse {freelancer.name.split(" ")[0]} for it
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {freelancer.skills.map((skill) => {
              const isEndorsed = endorsedSkills.includes(skill.name);
              const displayEndorsements =
                skill.endorsements + (isEndorsed ? 1 : 0);
              return (
                <button
                  key={skill.name}
                  onClick={() => toggleEndorsement(skill.name)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    isEndorsed
                      ? "border-[#0084ca] bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      {skill.name}
                    </span>
                    <div
                      className={`flex items-center gap-1 ${
                        isEndorsed ? "text-[#0084ca]" : "text-gray-500"
                      }`}
                    >
                      <ThumbsUp
                        className={`w-4 h-4 ${isEndorsed ? "fill-current" : ""}`}
                      />
                      <span className="text-sm font-medium">
                        {displayEndorsements}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {displayEndorsements}{" "}
                    {displayEndorsements === 1 ? "endorsement" : "endorsements"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Portfolio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {freelancer.portfolio.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg overflow-hidden group"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {item.description}
                  </p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0084ca] hover:underline text-sm flex items-center gap-1"
                    >
                      View Project <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold text-gray-900">
                {freelancer.rating}
              </span>
              <span className="text-gray-600">
                ({freelancer.reviews.length} reviews)
              </span>
            </div>
          </div>
          <div className="space-y-6">
            {freelancer.reviews.map((review) => (
              <div
                key={review.id}
                className="pb-6 border-b border-gray-200 last:border-0"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {review.client}
                    </h4>
                    <p className="text-sm text-gray-600">{review.project}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education & Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Education */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-2 mb-6">
              <GraduationCap className="w-6 h-6 text-[#0084ca]" />
              <h3 className="text-xl font-bold text-gray-900">Education</h3>
            </div>
            <div className="space-y-4">
              {freelancer.education.map((edu, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                  <p className="text-gray-600">{edu.school}</p>
                  <p className="text-sm text-gray-500">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-6 h-6 text-[#0084ca]" />
              <h3 className="text-xl font-bold text-gray-900">
                Certifications
              </h3>
            </div>
            <div className="space-y-4">
              {freelancer.certifications.map((cert, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                  <p className="text-gray-600">{cert.issuer}</p>
                  <p className="text-sm text-gray-500">{cert.year}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Languages</h3>
          <div className="flex flex-wrap gap-4">
            {freelancer.languages.map((lang, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{lang.name}:</span>
                <span className="text-gray-600">{lang.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
