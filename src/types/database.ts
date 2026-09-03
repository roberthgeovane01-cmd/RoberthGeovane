export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audio_entries: {
        Row: {
          byte_size: number | null
          created_at: string
          created_by: string
          duration_ms: number | null
          id: string
          metadata: Json
          mime_type: string
          original_filename: string | null
          recorded_at: string | null
          sha256: string | null
          status: string
          storage_path: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          created_by: string
          duration_ms?: number | null
          id?: string
          metadata?: Json
          mime_type: string
          original_filename?: string | null
          recorded_at?: string | null
          sha256?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          created_by?: string
          duration_ms?: number | null
          id?: string
          metadata?: Json
          mime_type?: string
          original_filename?: string | null
          recorded_at?: string | null
          sha256?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          created_by: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          new_data: Json | null
          old_data: Json | null
          request_id: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          created_by: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          request_id?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          created_by?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          request_id?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_evidence: {
        Row: {
          claim_id: string
          created_at: string
          created_by: string
          evidence_type: string
          excerpt: string | null
          id: string
          locator: Json
          source_chunk_id: string | null
          status: string
          strength: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          created_by: string
          evidence_type?: string
          excerpt?: string | null
          id?: string
          locator?: Json
          source_chunk_id?: string | null
          status?: string
          strength?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          created_by?: string
          evidence_type?: string
          excerpt?: string | null
          id?: string
          locator?: Json
          source_chunk_id?: string | null
          status?: string
          strength?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_evidence_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "source_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_evidence_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_relations: {
        Row: {
          confidence: number
          created_at: string
          created_by: string
          id: string
          rationale: string | null
          relation_type: string
          source_claim_id: string
          status: string
          target_claim_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          created_by: string
          id?: string
          rationale?: string | null
          relation_type: string
          source_claim_id: string
          status?: string
          target_claim_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          created_by?: string
          id?: string
          rationale?: string | null
          relation_type?: string
          source_claim_id?: string
          status?: string
          target_claim_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_relations_source_claim_id_fkey"
            columns: ["source_claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_relations_target_claim_id_fkey"
            columns: ["target_claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_relations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          claim_hash: string
          claim_type: string
          confidence: number
          created_at: string
          created_by: string
          embedding: string | null
          embedding_space_id: string | null
          id: string
          metadata: Json
          prompt_version_id: string | null
          search_vector: unknown
          source_id: string | null
          source_section_id: string | null
          source_version_id: string | null
          statement: string
          status: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          claim_hash: string
          claim_type?: string
          confidence?: number
          created_at?: string
          created_by: string
          embedding?: string | null
          embedding_space_id?: string | null
          id?: string
          metadata?: Json
          prompt_version_id?: string | null
          search_vector?: unknown
          source_id?: string | null
          source_section_id?: string | null
          source_version_id?: string | null
          statement: string
          status?: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          claim_hash?: string
          claim_type?: string
          confidence?: number
          created_at?: string
          created_by?: string
          embedding?: string | null
          embedding_space_id?: string | null
          id?: string
          metadata?: Json
          prompt_version_id?: string | null
          search_vector?: unknown
          source_id?: string | null
          source_section_id?: string | null
          source_version_id?: string | null
          statement?: string
          status?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_embedding_space_id_fkey"
            columns: ["embedding_space_id"]
            isOneToOne: false
            referencedRelation: "embedding_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_source_section_id_fkey"
            columns: ["source_section_id"]
            isOneToOne: false
            referencedRelation: "source_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "source_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          embedding: string | null
          embedding_space_id: string | null
          id: string
          name: string
          normalized_name: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          embedding?: string | null
          embedding_space_id?: string | null
          id?: string
          name: string
          normalized_name: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          embedding?: string | null
          embedding_space_id?: string | null
          id?: string
          name?: string
          normalized_name?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concepts_embedding_space_id_fkey"
            columns: ["embedding_space_id"]
            isOneToOne: false
            referencedRelation: "embedding_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concepts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_spaces: {
        Row: {
          created_at: string
          created_by: string
          dimensions: number
          id: string
          model: string
          provider: string
          status: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dimensions: number
          id?: string
          model: string
          provider: string
          status?: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dimensions?: number
          id?: string
          model?: string
          provider?: string
          status?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embedding_spaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conflict_resolutions: {
        Row: {
          conflict_id: string
          created_at: string
          created_by: string
          id: string
          notes: string
          resolution_type: string
          resolved_at: string
          resolved_by: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          conflict_id: string
          created_at?: string
          created_by: string
          id?: string
          notes: string
          resolution_type: string
          resolved_at?: string
          resolved_by: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          conflict_id?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string
          resolution_type?: string
          resolved_at?: string
          resolved_by?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conflict_resolutions_conflict_id_fkey"
            columns: ["conflict_id"]
            isOneToOne: false
            referencedRelation: "conflicts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_resolutions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conflicts: {
        Row: {
          blocks_writing: boolean
          conflict_type: string
          created_at: string
          created_by: string
          description: string
          id: string
          left_claim_id: string | null
          left_retrieval_hit_id: string | null
          memory_dossier_id: string | null
          right_claim_id: string | null
          right_retrieval_hit_id: string | null
          severity: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          blocks_writing?: boolean
          conflict_type: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          left_claim_id?: string | null
          left_retrieval_hit_id?: string | null
          memory_dossier_id?: string | null
          right_claim_id?: string | null
          right_retrieval_hit_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          blocks_writing?: boolean
          conflict_type?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          left_claim_id?: string | null
          left_retrieval_hit_id?: string | null
          memory_dossier_id?: string | null
          right_claim_id?: string | null
          right_retrieval_hit_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conflicts_left_claim_id_fkey"
            columns: ["left_claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflicts_left_retrieval_hit_id_fkey"
            columns: ["left_retrieval_hit_id"]
            isOneToOne: false
            referencedRelation: "retrieval_hits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflicts_memory_dossier_id_fkey"
            columns: ["memory_dossier_id"]
            isOneToOne: false
            referencedRelation: "memory_dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflicts_right_claim_id_fkey"
            columns: ["right_claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflicts_right_retrieval_hit_id_fkey"
            columns: ["right_retrieval_hit_id"]
            isOneToOne: false
            referencedRelation: "retrieval_hits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflicts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          consent_type: string
          created_at: string
          created_by: string
          evidence: Json
          granted: boolean
          id: string
          ip_address: unknown
          policy_version: string
          status: string
          updated_at: string
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          created_by: string
          evidence?: Json
          granted: boolean
          id?: string
          ip_address?: unknown
          policy_version: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          created_by?: string
          evidence?: Json
          granted?: boolean
          id?: string
          ip_address?: unknown
          policy_version?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_evidence: {
        Row: {
          classification_rationale: string | null
          confidence: number | null
          created_at: string
          created_by: string
          evidence_type: string
          excerpt: string
          id: string
          locator: Json
          memory_dossier_id: string
          relevance: number | null
          retrieval_hit_id: string | null
          stance: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          classification_rationale?: string | null
          confidence?: number | null
          created_at?: string
          created_by: string
          evidence_type: string
          excerpt: string
          id?: string
          locator?: Json
          memory_dossier_id: string
          relevance?: number | null
          retrieval_hit_id?: string | null
          stance?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          classification_rationale?: string | null
          confidence?: number | null
          created_at?: string
          created_by?: string
          evidence_type?: string
          excerpt?: string
          id?: string
          locator?: Json
          memory_dossier_id?: string
          relevance?: number | null
          retrieval_hit_id?: string | null
          stance?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_evidence_memory_dossier_id_fkey"
            columns: ["memory_dossier_id"]
            isOneToOne: false
            referencedRelation: "memory_dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_evidence_retrieval_hit_id_fkey"
            columns: ["retrieval_hit_id"]
            isOneToOne: false
            referencedRelation: "retrieval_hits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_evidence_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          occurred_from: string | null
          occurred_until: string | null
          people: Json
          places: Json
          status: string
          summary: string | null
          themes: Json
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          occurred_from?: string | null
          occurred_until?: string | null
          people?: Json
          places?: Json
          status?: string
          summary?: string | null
          themes?: Json
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          occurred_from?: string | null
          occurred_until?: string | null
          people?: Json
          places?: Json
          status?: string
          summary?: string | null
          themes?: Json
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          canonicality: number
          confidence: number
          content: string
          created_at: string
          created_by: string
          embedding: string | null
          id: string
          memory_type: string
          metadata: Json
          search_vector: unknown
          status: string
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          workspace_id: string
        }
        Insert: {
          canonicality?: number
          confidence?: number
          content: string
          created_at?: string
          created_by: string
          embedding?: string | null
          id?: string
          memory_type: string
          metadata?: Json
          search_vector?: unknown
          status?: string
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          workspace_id: string
        }
        Update: {
          canonicality?: number
          confidence?: number
          content?: string
          created_at?: string
          created_by?: string
          embedding?: string | null
          id?: string
          memory_type?: string
          metadata?: Json
          search_vector?: unknown
          status?: string
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_dossiers: {
        Row: {
          analyst_model: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          dossier: Json
          evidence_coverage: number | null
          executive_summary: string | null
          id: string
          question: string
          prompt_version: string
          retrieval_session_id: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          analyst_model?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          dossier?: Json
          evidence_coverage?: number | null
          executive_summary?: string | null
          id?: string
          question: string
          prompt_version?: string
          retrieval_session_id: string
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          analyst_model?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          dossier?: Json
          evidence_coverage?: number | null
          executive_summary?: string | null
          id?: string
          question?: string
          prompt_version?: string
          retrieval_session_id?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_dossiers_retrieval_session_id_fkey"
            columns: ["retrieval_session_id"]
            isOneToOne: false
            referencedRelation: "retrieval_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_dossiers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_relations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          relation_type: string
          source_memory_id: string
          status: string
          target_memory_id: string
          updated_at: string
          weight: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          relation_type: string
          source_memory_id: string
          status?: string
          target_memory_id: string
          updated_at?: string
          weight?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          relation_type?: string
          source_memory_id?: string
          status?: string
          target_memory_id?: string
          updated_at?: string
          weight?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_relations_source_memory_id_fkey"
            columns: ["source_memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_relations_target_memory_id_fkey"
            columns: ["target_memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_relations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          correlation_id: string
          created_at: string
          created_by: string
          current_step: string | null
          entity_id: string | null
          entity_type: string
          error_message: string | null
          id: string
          idempotency_key: string
          job_type: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          payload: Json
          progress: number
          result: Json | null
          run_after: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          created_by: string
          current_step?: string | null
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          idempotency_key: string
          job_type: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          progress?: number
          result?: Json | null
          run_after?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          created_by?: string
          current_step?: string | null
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string
          job_type?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          progress?: number
          result?: Json | null
          run_after?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string | null
          id: string
          locale: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_versions: {
        Row: {
          checksum: string
          content: string
          created_at: string
          created_by: string
          id: string
          input_schema: Json
          output_schema: Json
          prompt_key: string
          role: string
          status: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          checksum: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          input_schema?: Json
          output_schema?: Json
          prompt_key: string
          role: string
          status?: string
          updated_at?: string
          version: number
          workspace_id: string
        }
        Update: {
          checksum?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          input_schema?: Json
          output_schema?: Json
          prompt_key?: string
          role?: string
          status?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reflection_audio_versions: {
        Row: {
          created_at: string
          created_by: string
          duration_ms: number | null
          id: string
          mime_type: string
          model: string | null
          provider: string | null
          reflection_version_id: string
          status: string
          storage_path: string
          updated_at: string
          version: number
          voice_profile_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duration_ms?: number | null
          id?: string
          mime_type: string
          model?: string | null
          provider?: string | null
          reflection_version_id: string
          status?: string
          storage_path: string
          updated_at?: string
          version: number
          voice_profile_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duration_ms?: number | null
          id?: string
          mime_type?: string
          model?: string | null
          provider?: string | null
          reflection_version_id?: string
          status?: string
          storage_path?: string
          updated_at?: string
          version?: number
          voice_profile_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_audio_versions_reflection_version_id_fkey"
            columns: ["reflection_version_id"]
            isOneToOne: false
            referencedRelation: "reflection_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_audio_versions_voice_profile_id_fkey"
            columns: ["voice_profile_id"]
            isOneToOne: false
            referencedRelation: "voice_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_audio_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reflection_sessions: {
        Row: {
          audio_entry_id: string | null
          context: Json
          created_at: string
          created_by: string
          current_step: string
          episode_id: string | null
          id: string
          memory_dossier_id: string | null
          retrieval_session_id: string | null
          status: string
          transcript_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          audio_entry_id?: string | null
          context?: Json
          created_at?: string
          created_by: string
          current_step?: string
          episode_id?: string | null
          id?: string
          memory_dossier_id?: string | null
          retrieval_session_id?: string | null
          status?: string
          transcript_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          audio_entry_id?: string | null
          context?: Json
          created_at?: string
          created_by?: string
          current_step?: string
          episode_id?: string | null
          id?: string
          memory_dossier_id?: string | null
          retrieval_session_id?: string | null
          status?: string
          transcript_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_sessions_audio_entry_id_fkey"
            columns: ["audio_entry_id"]
            isOneToOne: false
            referencedRelation: "audio_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_sessions_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_sessions_memory_dossier_id_fkey"
            columns: ["memory_dossier_id"]
            isOneToOne: false
            referencedRelation: "memory_dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_sessions_retrieval_session_id_fkey"
            columns: ["retrieval_session_id"]
            isOneToOne: false
            referencedRelation: "retrieval_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_sessions_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reflection_sources: {
        Row: {
          citation_order: number
          claim_id: string | null
          created_at: string
          created_by: string
          id: string
          locator: Json
          memory_id: string | null
          quoted_text: string | null
          reflection_version_id: string
          source_chunk_id: string | null
          source_id: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          citation_order: number
          claim_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          locator?: Json
          memory_id?: string | null
          quoted_text?: string | null
          reflection_version_id: string
          source_chunk_id?: string | null
          source_id?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          citation_order?: number
          claim_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          locator?: Json
          memory_id?: string | null
          quoted_text?: string | null
          reflection_version_id?: string
          source_chunk_id?: string | null
          source_id?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_sources_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_sources_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_sources_reflection_version_id_fkey"
            columns: ["reflection_version_id"]
            isOneToOne: false
            referencedRelation: "reflection_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_sources_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "source_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reflection_versions: {
        Row: {
          content: string
          created_at: string
          created_by: string
          generation_metadata: Json
          id: string
          prompt_version_id: string | null
          reflection_id: string
          status: string
          updated_at: string
          version: number
          workspace_id: string
          writer_model: string | null
          writer_provider: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          generation_metadata?: Json
          id?: string
          prompt_version_id?: string | null
          reflection_id: string
          status?: string
          updated_at?: string
          version: number
          workspace_id: string
          writer_model?: string | null
          writer_provider?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          generation_metadata?: Json
          id?: string
          prompt_version_id?: string | null
          reflection_id?: string
          status?: string
          updated_at?: string
          version?: number
          workspace_id?: string
          writer_model?: string | null
          writer_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflection_versions_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_versions_reflection_id_fkey"
            columns: ["reflection_id"]
            isOneToOne: false
            referencedRelation: "reflections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reflections: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          id: string
          reflection_session_id: string
          status: string
          synopsis: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          reflection_session_id: string
          status?: string
          synopsis?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          reflection_session_id?: string
          status?: string
          synopsis?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_reflection_session_id_fkey"
            columns: ["reflection_session_id"]
            isOneToOne: false
            referencedRelation: "reflection_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      retrieval_hits: {
        Row: {
          authority_score: number | null
          claim_id: string | null
          created_at: string
          created_by: string
          diversity_penalty: number
          entity_type: string
          final_score: number | null
          id: string
          lexical_score: number | null
          memory_id: string | null
          rank: number | null
          rationale: string | null
          rerank_score: number | null
          retrieval_query_id: string | null
          retrieval_level: string | null
          retrieval_session_id: string
          rrf_score: number | null
          selected: boolean
          source_chunk_id: string | null
          source_id: string | null
          source_section_id: string | null
          source_summary_id: string | null
          specificity_score: number | null
          status: string
          temporal_score: number | null
          updated_at: string
          vector_score: number | null
          workspace_id: string
        }
        Insert: {
          authority_score?: number | null
          claim_id?: string | null
          created_at?: string
          created_by: string
          diversity_penalty?: number
          entity_type: string
          final_score?: number | null
          id?: string
          lexical_score?: number | null
          memory_id?: string | null
          rank?: number | null
          rationale?: string | null
          rerank_score?: number | null
          retrieval_query_id?: string | null
          retrieval_level?: string | null
          retrieval_session_id: string
          rrf_score?: number | null
          selected?: boolean
          source_chunk_id?: string | null
          source_id?: string | null
          source_section_id?: string | null
          source_summary_id?: string | null
          specificity_score?: number | null
          status?: string
          temporal_score?: number | null
          updated_at?: string
          vector_score?: number | null
          workspace_id: string
        }
        Update: {
          authority_score?: number | null
          claim_id?: string | null
          created_at?: string
          created_by?: string
          diversity_penalty?: number
          entity_type?: string
          final_score?: number | null
          id?: string
          lexical_score?: number | null
          memory_id?: string | null
          rank?: number | null
          rationale?: string | null
          rerank_score?: number | null
          retrieval_query_id?: string | null
          retrieval_level?: string | null
          retrieval_session_id?: string
          rrf_score?: number | null
          selected?: boolean
          source_chunk_id?: string | null
          source_id?: string | null
          source_section_id?: string | null
          source_summary_id?: string | null
          specificity_score?: number | null
          status?: string
          temporal_score?: number | null
          updated_at?: string
          vector_score?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retrieval_hits_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_hits_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_hits_retrieval_query_id_fkey"
            columns: ["retrieval_query_id"]
            isOneToOne: false
            referencedRelation: "retrieval_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_hits_retrieval_session_id_fkey"
            columns: ["retrieval_session_id"]
            isOneToOne: false
            referencedRelation: "retrieval_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_hits_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "source_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_hits_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_hits_source_section_id_fkey"
            columns: ["source_section_id"]
            isOneToOne: false
            referencedRelation: "source_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_hits_source_summary_id_fkey"
            columns: ["source_summary_id"]
            isOneToOne: false
            referencedRelation: "source_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_hits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      retrieval_queries: {
        Row: {
          created_at: string
          created_by: string
          embedding: string | null
          embedding_space_id: string | null
          id: string
          ordinal: number
          parameters: Json
          query_text: string
          query_type: string
          retrieval_session_id: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          embedding?: string | null
          embedding_space_id?: string | null
          id?: string
          ordinal?: number
          parameters?: Json
          query_text: string
          query_type: string
          retrieval_session_id: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          embedding?: string | null
          embedding_space_id?: string | null
          id?: string
          ordinal?: number
          parameters?: Json
          query_text?: string
          query_type?: string
          retrieval_session_id?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retrieval_queries_embedding_space_id_fkey"
            columns: ["embedding_space_id"]
            isOneToOne: false
            referencedRelation: "embedding_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_queries_retrieval_session_id_fkey"
            columns: ["retrieval_session_id"]
            isOneToOne: false
            referencedRelation: "retrieval_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_queries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      retrieval_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          id: string
          parameters: Json
          started_at: string
          status: string
          updated_at: string
          user_query: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          parameters?: Json
          started_at?: string
          status?: string
          updated_at?: string
          user_query: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          parameters?: Json
          started_at?: string
          status?: string
          updated_at?: string
          user_query?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retrieval_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      source_chunks: {
        Row: {
          chunker_version: number
          content: string
          content_hash: string
          created_at: string
          created_by: string
          embedding: string | null
          embedding_space_id: string | null
          id: string
          locator: Json
          metadata: Json
          ordinal: number
          search_vector: unknown
          source_id: string
          source_section_id: string | null
          source_version_id: string
          status: string
          token_count: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          chunker_version?: number
          content: string
          content_hash: string
          created_at?: string
          created_by: string
          embedding?: string | null
          embedding_space_id?: string | null
          id?: string
          locator?: Json
          metadata?: Json
          ordinal: number
          search_vector?: unknown
          source_id: string
          source_section_id?: string | null
          source_version_id: string
          status?: string
          token_count?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          chunker_version?: number
          content?: string
          content_hash?: string
          created_at?: string
          created_by?: string
          embedding?: string | null
          embedding_space_id?: string | null
          id?: string
          locator?: Json
          metadata?: Json
          ordinal?: number
          search_vector?: unknown
          source_id?: string
          source_section_id?: string | null
          source_version_id?: string
          status?: string
          token_count?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_chunks_embedding_space_id_fkey"
            columns: ["embedding_space_id"]
            isOneToOne: false
            referencedRelation: "embedding_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_chunks_source_section_id_fkey"
            columns: ["source_section_id"]
            isOneToOne: false
            referencedRelation: "source_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_chunks_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "source_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      source_concepts: {
        Row: {
          concept_id: string
          created_at: string
          created_by: string
          evidence: Json
          id: string
          relevance: number | null
          source_id: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          created_by: string
          evidence?: Json
          id?: string
          relevance?: number | null
          source_id: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          created_by?: string
          evidence?: Json
          id?: string
          relevance?: number | null
          source_id?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_concepts_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_concepts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_concepts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      source_sections: {
        Row: {
          content: string
          created_at: string
          created_by: string
          heading: string | null
          id: string
          level: number
          locator: Json
          ordinal: number
          parent_section_id: string | null
          source_version_id: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          created_by: string
          heading?: string | null
          id?: string
          level?: number
          locator?: Json
          ordinal: number
          parent_section_id?: string | null
          source_version_id: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          heading?: string | null
          id?: string
          level?: number
          locator?: Json
          ordinal?: number
          parent_section_id?: string | null
          source_version_id?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_sections_parent_section_id_fkey"
            columns: ["parent_section_id"]
            isOneToOne: false
            referencedRelation: "source_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_sections_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "source_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_sections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      source_summaries: {
        Row: {
          content: string
          content_hash: string
          created_at: string
          created_by: string
          embedding: string | null
          embedding_space_id: string | null
          id: string
          metadata: Json
          model: string | null
          model_provider: string | null
          prompt_version_id: string | null
          search_vector: unknown
          source_id: string
          source_section_id: string | null
          source_version_id: string | null
          status: string
          summary_kind: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          content: string
          content_hash: string
          created_at?: string
          created_by: string
          embedding?: string | null
          embedding_space_id?: string | null
          id?: string
          metadata?: Json
          model?: string | null
          model_provider?: string | null
          prompt_version_id?: string | null
          search_vector?: unknown
          source_id: string
          source_section_id?: string | null
          source_version_id?: string | null
          status?: string
          summary_kind: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          content?: string
          content_hash?: string
          created_at?: string
          created_by?: string
          embedding?: string | null
          embedding_space_id?: string | null
          id?: string
          metadata?: Json
          model?: string | null
          model_provider?: string | null
          prompt_version_id?: string | null
          search_vector?: unknown
          source_id?: string
          source_section_id?: string | null
          source_version_id?: string | null
          status?: string
          summary_kind?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_summaries_embedding_space_id_fkey"
            columns: ["embedding_space_id"]
            isOneToOne: false
            referencedRelation: "embedding_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_summaries_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_summaries_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_summaries_source_section_id_fkey"
            columns: ["source_section_id"]
            isOneToOne: false
            referencedRelation: "source_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_summaries_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "source_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_summaries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      source_tags: {
        Row: {
          created_at: string
          created_by: string
          id: string
          source_id: string
          status: string
          tag_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          source_id: string
          status?: string
          tag_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          source_id?: string
          status?: string
          tag_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_tags_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      source_versions: {
        Row: {
          byte_size: number
          created_at: string
          created_by: string
          extracted_text: string | null
          extraction_status: string
          id: string
          memory_built_at: string | null
          memory_error: string | null
          memory_revision: number
          memory_status: string
          mime_type: string
          original_filename: string
          page_count: number | null
          sha256: string
          source_id: string
          status: string
          storage_path: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          created_by: string
          extracted_text?: string | null
          extraction_status?: string
          id?: string
          memory_built_at?: string | null
          memory_error?: string | null
          memory_revision?: number
          memory_status?: string
          mime_type: string
          original_filename: string
          page_count?: number | null
          sha256: string
          source_id: string
          status?: string
          storage_path: string
          updated_at?: string
          version: number
          workspace_id: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          created_by?: string
          extracted_text?: string | null
          extraction_status?: string
          id?: string
          memory_built_at?: string | null
          memory_error?: string | null
          memory_revision?: number
          memory_status?: string
          mime_type?: string
          original_filename?: string
          page_count?: number | null
          sha256?: string
          source_id?: string
          status?: string
          storage_path?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_versions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          author_name: string | null
          authority_level: number
          created_at: string
          created_by: string
          id: string
          language: string
          metadata: Json
          publication_year: number | null
          source_type: string
          status: string
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          workspace_id: string
        }
        Insert: {
          author_name?: string | null
          authority_level?: number
          created_at?: string
          created_by: string
          id?: string
          language?: string
          metadata?: Json
          publication_year?: number | null
          source_type: string
          status?: string
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          workspace_id: string
        }
        Update: {
          author_name?: string | null
          authority_level?: number
          created_at?: string
          created_by?: string
          id?: string
          language?: string
          metadata?: Json
          publication_year?: number | null
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      style_examples: {
        Row: {
          content: string
          created_at: string
          created_by: string
          embedding: string | null
          id: string
          notes: string | null
          status: string
          style_profile_id: string
          title: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          embedding?: string | null
          id?: string
          notes?: string | null
          status?: string
          style_profile_id: string
          title?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          embedding?: string | null
          id?: string
          notes?: string | null
          status?: string
          style_profile_id?: string
          title?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_examples_style_profile_id_fkey"
            columns: ["style_profile_id"]
            isOneToOne: false
            referencedRelation: "style_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "style_examples_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      style_profiles: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          rules: Json
          status: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          rules?: Json
          status?: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          rules?: Json
          status?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          created_at: string
          id: number
          is_complete: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_complete?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: never
          is_complete?: boolean
          name?: string
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_text: string | null
          audio_entry_id: string
          confidence: number | null
          created_at: string
          created_by: string
          id: string
          language: string
          model: string | null
          provider: string | null
          raw_text: string
          status: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_text?: string | null
          audio_entry_id: string
          confidence?: number | null
          created_at?: string
          created_by: string
          id?: string
          language?: string
          model?: string | null
          provider?: string | null
          raw_text: string
          status?: string
          updated_at?: string
          version: number
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_text?: string | null
          audio_entry_id?: string
          confidence?: number | null
          created_at?: string
          created_by?: string
          id?: string
          language?: string
          model?: string | null
          provider?: string | null
          raw_text?: string
          status?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_audio_entry_id_fkey"
            columns: ["audio_entry_id"]
            isOneToOne: false
            referencedRelation: "audio_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_profiles: {
        Row: {
          active: boolean
          consent_log_id: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          provider: string
          provider_voice_id: string
          settings: Json
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          consent_log_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          provider: string
          provider_voice_id: string
          settings?: Json
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          consent_log_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          provider?: string
          provider_voice_id?: string
          settings?: Json
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_profiles_consent_log_id_fkey"
            columns: ["consent_log_id"]
            isOneToOne: false
            referencedRelation: "consent_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          created_by: string
          id: string
          role: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_memory_hybrid: {
        Args: {
          p_embedding_space_id?: string | null
          p_match_count?: number
          p_query_embedding?: string | null
          p_query_text: string
          p_rrf_k?: number
          p_source_ids?: string[] | null
          p_workspace_id: string
        }
        Returns: {
          authority_level: number
          content: string
          entity_id: string
          entity_type: string
          lexical_score: number | null
          retrieval_level: string
          rrf_score: number
          source_id: string
          source_section_id: string | null
          valid_from: string | null
          valid_until: string | null
          vector_score: number | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
